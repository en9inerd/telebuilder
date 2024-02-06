import { Api, TelegramClient } from 'telegram';
import { CustomFile } from 'telegram/client/uploads.js';
import { Album } from 'telegram/events/Album.js';
import { CallbackQuery, NewCallbackQueryInterface } from 'telegram/events/CallbackQuery.js';
import { DeletedMessage } from 'telegram/events/DeletedMessage.js';
import { EditedMessage, EditedMessageInterface } from 'telegram/events/EditedMessage.js';
import { NewMessageInterface } from 'telegram/events/NewMessage.js';
import { RawInterface } from 'telegram/events/Raw.js';
import { DefaultEventInterface } from 'telegram/events/common.js';
import { NewMessage, Raw } from 'telegram/events/index.js';
import { StringSession } from 'telegram/sessions/index.js';
import { config } from '../config.js';
import { TelegramClientException } from '../exceptions.js';
import { CSHelper } from '../helpers/command-scope.helper.js';
import { Store } from '../helpers/store.helper.js';
import { ClassType, commandScopeMap, handlerKeys } from '../keys.js';
import { BaseDBService } from '../services/index.js';
import { container } from '../states/container.js';
import { ClientParams, Command, CommandHandler, CommandScope, EntryHandler, EventInterface, ExtendedCommand, GroupedCommandScopes, HandlerType, HandlerTypes } from '../types.js';
import { eventManager } from '../event-manager.js';

export class TelegramBotClient extends TelegramClient {
  private readonly commands: Command[] = [];
  private readonly dbService!: BaseDBService;
  protected readonly sessionName: string;
  private isExiting = false;

  constructor(
    protected readonly params?: ClientParams
  ) {
    const sessionName = config.get<string>('botConfig.testServers') ? 'testSession' : 'session';

    super(
      new StringSession(Store.get(sessionName, '')),
      config.get('botConfig.apiId'),
      config.get('botConfig.apiHash'),
      {
        baseLogger: params?.baseLogger,
        connectionRetries: config.get('botConfig.connectionRetries'),
        deviceModel: config.get('botConfig.deviceModel'),
        appVersion: config.get('botConfig.appVersion'),
        systemVersion: config.get('botConfig.systemVersion'),
        langCode: config.get('botConfig.connectionLangCode'),
        systemLangCode: config.get('botConfig.systemLangCode'),
        testServers: config.get('botConfig.testServers'),
        useWSS: config.get('botConfig.useWSS'),
      },
    );
    this.sessionName = sessionName;
    container.client = this;

    const dcId = config.get<number>('botConfig.dcId');
    const serverAddress = config.get<string>('botConfig.serverAddress');
    const serverPort = config.get<number>('botConfig.serverPort');
    if (dcId && serverAddress && serverPort && !this.session.serverAddress) {
      this.session.setDC(dcId, serverAddress, serverPort);
    }

    // initialize db service
    if (params?.dbService) this.dbService = container.resolve<BaseDBService>(params?.dbService, ClassType.Service);

    // initialize commands
    if (params?.commands && params.commands.length > 0) {
      this.commands = params.commands.map((c) => container.resolve<Command>(c, ClassType.Command));
    } else {
      throw new TelegramClientException('No commands provided');
    }
  }

  public async init(): Promise<void> {
    // Register signal handlers
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, async () => {
        if (!this.isExiting) {
          this.isExiting = true;
          await this.handleExit(0);
        }
      });
    }

    // Register exit handler
    process.on('exit', async (code: number) => {
      if (!this.isExiting) {
        this.isExiting = true;
        await this.handleExit(code);
      }
    });

    try {
      // Connect to the database
      if (this.dbService) {
        await this.dbService.init();
        this.logger.info('Database connected successfully.');
      }

      // Initialize the bot or user bot
      if (this.constructor.name === 'TelegramBotClient')
        await this.initBot();
      else
        await this.initUserBot();

      // Emit the onInit event
      eventManager.emit('onInit', this);

      this.logger.info('Bot initialized successfully.');
    } catch (error) {
      this.logger.error(`${(<Error>error)?.name}: ${(<Error>error)?.message}`);
      console.error(error);
      this.isExiting = true;
      await this.handleExit(1);
    }
  }

  private async initBot(): Promise<void> {
    // Start the bot
    await this.start({
      botAuthToken: config.get('botConfig.token'),
    });

    // Save the session if it doesn't exist
    if (!Store.get(this.sessionName, '')) {
      Store.set(this.sessionName, this.session.save());
    }

    // upload the bot profile photo
    await this.uploadProfilePhoto();

    // update the bot profile info
    await this.updateProfileInfo();

    // Synchronize and initialize commands
    await this.syncAndInitCommands();

    // Register event handlers
    await this.registerEventHandlers();
  }

  protected async initUserBot(): Promise<void> {
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

  public registerEventHandler(handlerFunction: CommandHandler | EntryHandler, eventType: HandlerType, eventParams: EventInterface): void {
    switch (eventType) {
      case HandlerTypes.CallbackQuery:
        this.addEventHandler(handlerFunction, new CallbackQuery(<NewCallbackQueryInterface>eventParams));
        break;
      case HandlerTypes.NewMessage:
        this.addEventHandler(handlerFunction, new NewMessage(<NewMessageInterface>eventParams));
        break;
      case HandlerTypes.Raw:
        this.addEventHandler(handlerFunction, new Raw(<RawInterface>eventParams));
        break;
      case HandlerTypes.EditedMessage:
        this.addEventHandler(handlerFunction, new EditedMessage(<EditedMessageInterface>eventParams));
        break;
      case HandlerTypes.Album:
        this.addEventHandler(handlerFunction, new Album(<DefaultEventInterface>eventParams));
        break;
      case HandlerTypes.DeletedMessage:
        this.addEventHandler(handlerFunction, new DeletedMessage(<DefaultEventInterface>eventParams));
        break;
      default:
        break;
    }
  }

  protected async registerEventHandlers(): Promise<void> {
    // Register default event handlers
    for (const command of this.commands) {
      for (const [eventType, key] of Object.entries(handlerKeys)) {
        if (!(key in command)) continue;

        const eventHandlers = (<ExtendedCommand>command)[key];
        for (const [handlerName, eventParams] of eventHandlers.entries()) {
          if (handlerName === 'entryHandler') {
            // command example: /start key1=value1 key2=value2 key3=value3
            const commandMessagePattern = new RegExp(`/${command.command}\\s?[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};':"\\|,.<>\\/? ]*`, 'g');
            (<NewMessageInterface>eventParams).pattern = commandMessagePattern;
          }

          if (eventType === HandlerTypes.CallbackQuery && !(<NewCallbackQueryInterface>eventParams)?.pattern) {
            // callback query data: commandClassName:handlerName:key1=value1&key2=value2&key3=value3
            const pattern = new RegExp(`^${command.constructor.name}:${handlerName}(:.*)?$`, 'g');
            (<NewCallbackQueryInterface>eventParams).pattern = pattern;
          }

          this.registerEventHandler((<ExtendedCommand>command)[handlerName], <HandlerType>eventType, eventParams);
        }
      }
    }
    this.logger.info('Default event handlers are registered');

    if (this.dbService) {
      // Register event handlers from the database
      eventManager.emit('onRegisterEventHandlers', this);
    }
  }

  private async getCommandScopeInstance(scopeStr: string): Promise<Api.TypeBotCommandScope> {
    const scope: CommandScope = CSHelper.convertScopeStrToObject(scopeStr);
    if (!commandScopeMap[scope?.name]) {
      const err = `Command scope '${scope?.name}' is not supported`;
      this.logger.error(err);
      throw new TelegramClientException(err);
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

  private async uploadProfilePhoto(): Promise<void> {
    const profilePhotoUrl = config.get<string>('botConfig.profilePhotoUrl');
    if (profilePhotoUrl) {
      const response = await fetch(profilePhotoUrl);
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
  }

  private async updateProfileInfo(): Promise<void> {
    const name = config.get<string>('botConfig.name');
    const about = config.get<string>('botConfig.about');
    const description = config.get<string>('botConfig.description');
    const langCode = config.get<string>('botConfig.botInfoLangCode');

    const botInfo = await this.invoke(
      new Api.bots.GetBotInfo({
        langCode
      }),
    );

    if (botInfo?.description !== description ||
      botInfo?.about !== about ||
      botInfo?.name !== name
    ) {
      await this.invoke(
        new Api.bots.SetBotInfo({
          description,
          about,
          name,
          langCode,
        }),
      );
    }
  }

  private async handleExit(exitCode: number): Promise<void> {
    try {
      await this.destroy();
      this.logger.info('Bot cleanup completed.');
    } catch (error) {
      this.logger.error(`${(<Error>error)?.name}: ${(<Error>error)?.message}`);
      exitCode = 1;
    } finally {
      process.exit(exitCode);
    }
  }
}
