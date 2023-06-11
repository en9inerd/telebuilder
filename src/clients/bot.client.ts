import config from 'config';
import { Api, Logger, TelegramClient } from 'telegram';
import { Store } from '../helpers';
import { NewMessage } from 'telegram/events';
import type { Command, GroupedCommandScopes } from '../types';
import { StringSession } from 'telegram/sessions';
import { CommandScope } from '../types';
import { Utils } from '../utils';
import { callbackQueryHandlerNames, commandScopeMap } from '../keys';
import { CallbackQuery, CallbackQueryEvent } from 'telegram/events/CallbackQuery';
import { discoverCommands } from '../discovery';
import { DBService } from '../services';
import { TelegramClientError } from '../exceptions';

export class TelegramBotClient extends TelegramClient {
  private commands: Command[] = [];

  constructor(
    private readonly dbService = new DBService(),
    private readonly params?: {
      baseLogger?: Logger;
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
      // Initialize commands
      this.commands = await discoverCommands();

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
    const groupedCommands = Utils.groupCommandsByScope(this.commands);
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
              if (commands.includes(c.command) && typeof c?.defaultHandler === 'function') {
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
      const event = new NewMessage({
        // command example: /start key1=value1 key2=value2 key3=value3
        pattern: new RegExp(`/${command.command}\\s?[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};':"\\|,.<>\\/? ]*`, 'g'),
      });
      if (command?.defaultHandler) this.addEventHandler(command.defaultHandler, event);

      if (callbackQueryHandlerNames in command) {
        (<Set<string>>command[callbackQueryHandlerNames]).forEach((handlerName) => {
          const pattern = new RegExp(`^${command.constructor.name}:${handlerName}(:.*)?$`, 'g');
          this.addEventHandler((<Record<string, (event: CallbackQueryEvent) => void>><unknown>command)[handlerName], new CallbackQuery({ pattern }));
        });
      }
    }
    this.logger.info('Default event handlers are registered');

    // custom event handlers
    // they should be taken from database here
    this.logger.info('Custom event handlers are registered');
  }

  private async getCommandScopeInstance(scopeStr: string): Promise<Api.TypeBotCommandScope> {
    const scope: CommandScope = Utils.convertScopeStrToObject(scopeStr);
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
