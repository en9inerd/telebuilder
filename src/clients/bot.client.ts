import config from 'config';
import { Api, Logger, TelegramClient } from 'telegram';
import { Store } from '../helpers';
import { NewMessage, Raw } from 'telegram/events';
import { Command, Constructor, ExtendedCommand, GroupedCommandScopes, HandlerTypes } from '../types';
import { StringSession } from 'telegram/sessions';
import { CommandScope } from '../types';
import { CSHelper } from '../helpers';
import { ClassType, commandScopeMap, handlerKeys } from '../keys';
import { CallbackQuery, NewCallbackQueryInterface } from 'telegram/events/CallbackQuery';
import { DBService } from '../services';
import { TelegramClientError } from '../exceptions';
import { container } from '../states/container';
import { NewMessageInterface } from 'telegram/events/NewMessage';
import { CustomFile } from 'telegram/client/uploads';

export class TelegramBotClient extends TelegramClient {
  private readonly commands: Command[] = [];
  private readonly dbService: DBService;

  constructor(
    private readonly params?: {
      baseLogger?: Logger;
      commands?: Constructor<Command>[];
      dbService?: Constructor<DBService>;
    }
  ) {
    super(
      new StringSession(Store.get('stringSession', '')),
      config.get('botConfig.apiId'),
      config.get('botConfig.apiHash'),
      {
        baseLogger: params?.baseLogger,
        connectionRetries: config.get('botConfig.connectionRetries'),
        deviceModel: config.get('botConfig.deviceModel'),
        appVersion: config.get('botConfig.appVersion'),
        systemVersion: config.get('botConfig.systemVersion'),
        langCode: config.get('botConfig.langCode'),
        systemLangCode: config.get('botConfig.systemLangCode'),
      },
    );
    container.client = this;

    // initialize db service
    this.dbService = container.resolve<DBService>(params?.dbService || DBService, ClassType.Service);

    // initialize commands
    if (params?.commands && params.commands.length > 0) {
      this.commands = params.commands.map((c) => container.resolve<Command>(c, ClassType.Command));
    } else {
      throw new TelegramClientError('No commands provided');
    }
  }

  public async init(): Promise<void> {
    // Register termination signal handlers
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, async () => {
        await this.handleExit(0);
      });
    }

    // Register exit handler
    process.on('exit', async (code: number) => {
      await this.handleExit(code);
    });

    try {
      // Connect to the database
      await this.dbService.init();
      this.logger.info('Database connected successfully.');

      // Start the bot
      await this.start({
        botAuthToken: config.get('botConfig.token'),
      });

      // Save the session if it doesn't exist
      if (!Store.get('stringSession', '')) {
        Store.set('stringSession', this.session.save());
      }

      // upload the bot profile photo
      if (config.get('botConfig.profilePhotoUrl')) {
        const response = await fetch(config.get<string>('botConfig.profilePhotoUrl'));
        const extension = response.headers.get('content-type')?.split('/')[1];
        const buffer = Buffer.from(await response.arrayBuffer());
        const file = new CustomFile(
          'profile_photo.' + extension,
          buffer.byteLength,
          '',
          buffer
        );

        await this.invoke(
          new Api.photos.UploadProfilePhoto({
            file: await this.uploadFile({
              file,
              workers: 1,
            }),
          }),
        );
      }

      // Synchronize and initialize commands
      await this.syncAndInitCommands();

      // Register event handlers
      await this.registerEventHandlers();

      this.logger.info('Bot initialized successfully.');
    } catch (error: unknown) {
      this.logger.error(`${(<Error>error)?.name}: ${(<Error>error)?.message}`);
      console.error(error);
      await this.handleExit(1);
    }
  }

  private async syncAndInitCommands(): Promise<void> {
    // reset all previous command scopes
    const previousCommandScopes: GroupedCommandScopes = JSON.parse(Store.get('commandScopes', '[]'));
    for (const [scopeStr, langCodes] of Object.entries(previousCommandScopes)) {
      for (const [langCode] of Object.entries(langCodes)) {
        await this.invoke(
          new Api.bots.ResetBotCommands({
            scope: await this.getCommandScopeInstance(scopeStr),
            langCode,
          }),
        );
      }
    }
    this.logger.info('Reset all previous command scopes');

    // save new command scopes
    const groupedCommands = CSHelper.groupCommandsByScope(this.commands);
    Store.set('commandScopes', JSON.stringify(groupedCommands));
    this.logger.info('Saved new command scopes');

    // set commands for each scope and lang code
    for (const [scopeStr, langCodes] of Object.entries(groupedCommands)) {
      for (const [langCode, commands] of Object.entries(langCodes)) {
        await this.invoke(
          new Api.bots.SetBotCommands({
            scope: await this.getCommandScopeInstance(scopeStr),
            langCode,
            commands: this.commands.reduce((acc: Api.BotCommand[], c) => {
              if (commands.includes(c.command) && typeof c?.entryHandler === 'function') {
                acc.push(
                  new Api.BotCommand({
                    command: c.command,
                    description: c.description,
                  }),
                );
              }
              return acc;
            }, []),
          }),
        );
      }
    }
    this.logger.info('Set new commands');
  }

  private async registerEventHandlers(): Promise<void> {
    // default event handlers
    for (const command of this.commands) {
      // command example: /start key1=value1 key2=value2 key3=value3
      const commandMessagePattern = new RegExp(`/${command.command}\\s?[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};':"\\|,.<>\\/? ]*`, 'g');

      if (command?.entryHandler) {
        this.addEventHandler(command.entryHandler, new NewMessage({ pattern: commandMessagePattern }));
      }

      for (const [eventType, key] of Object.entries(handlerKeys)) {
        if (!(key in command)) continue;

        const eventHandlers = (<ExtendedCommand>command)[key];
        for (const [handlerName, params] of eventHandlers.entries()) {
          let pattern: RegExp;
          switch (eventType) {
            case HandlerTypes.CallbackQuery:
              // callback query data: CommandClass:handlerName:key1=value1&key2=value2&key3=value3
              pattern = new RegExp(`^${command.constructor.name}:${handlerName}(:.*)?$`, 'g');
              this.addEventHandler((<ExtendedCommand>command)[handlerName], new CallbackQuery(<NewCallbackQueryInterface>{
                pattern,
                ...params,
              }));
              break;
            case HandlerTypes.Raw:
              this.addEventHandler((<ExtendedCommand>command)[handlerName], new Raw({}));
              break;
            case HandlerTypes.NewMessage:
              this.addEventHandler((<ExtendedCommand>command)[handlerName], new NewMessage(<NewMessageInterface>{
                pattern: commandMessagePattern,
                ...params,
              }));
              break;
            default:
              break;
          }
        }
      }
    }

    this.logger.info('Default event handlers are registered');

    // custom event handlers
    // they should be taken from database here
    this.logger.info('Custom event handlers are registered');
  }

  private async getCommandScopeInstance(scopeStr: string): Promise<Api.TypeBotCommandScope> {
    const scope: CommandScope = CSHelper.convertScopeStrToObject(scopeStr);
    if (!commandScopeMap[scope?.name]) {
      const err = `Command scope '${scope?.name}' is not supported`;
      this.logger.error(err);
      throw new TelegramClientError(err);
    }
    if ('peer' in scope && 'userId' in scope) {
      const inputPeer = await this.getInputEntity(scope.peer);
      const inputPeerUser = <Api.TypeInputUser>(<unknown>await this.getInputEntity(scope.userId));
      return new commandScopeMap[scope.name]({ peer: inputPeer, userId: inputPeerUser });
    } else if ('peer' in scope) {
      const inputPeer = await this.getInputEntity(scope.peer);
      return new commandScopeMap[scope.name]({ peer: inputPeer });
    } else {
      return new commandScopeMap[scope.name]();
    }
  }

  private async handleExit(exitCode: number): Promise<void> {
    try {
      await this.destroy();
      this.logger.info('Bot cleanup completed.');

      process.exit(exitCode);
    } catch (error) {
      this.logger.error(`${(<Error>error)?.name}: ${(<Error>error)?.message}`);
      process.exit(1);
    }
  }
}
