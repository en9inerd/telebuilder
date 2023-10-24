import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { config } from '../config.js';
import { userInputHandler } from '../helpers/index.js';
import { getClient } from '../states/index.js';
import { formatErrorMessage } from '../utils.js';

export class TelegramUserClient extends TelegramClient {
  constructor(
    private readonly sessionStr: string,
    private readonly userId: bigInt.BigInteger,
    private readonly botClient = getClient()
  ) {
    super(
      new StringSession(sessionStr),
      config.get('botConfig.apiId'),
      config.get('botConfig.apiHash'),
      {
        baseLogger: botClient.logger,
        connectionRetries: config.get('botConfig.connectionRetries'),
        deviceModel: config.get('botConfig.deviceModel'),
        appVersion: config.get('botConfig.appVersion'),
        systemVersion: config.get('botConfig.systemVersion'),
        langCode: config.get('botConfig.connectionLangCode'),
        systemLangCode: config.get('botConfig.systemLangCode')
      }
    );
  }

  public async init(): Promise<void> {
    let numberOfTries = 0;

    await this.start({
      phoneNumber: async () => await userInputHandler(this.userId, { message: 'Enter your phone number:' }),
      password: async () => await userInputHandler(this.userId, { message: 'Enter your password:' }),
      phoneCode: async () => await userInputHandler(this.userId, { message: 'Enter the code you received:' }, true, true),
      onError: async (err) => {
        if (err.message === 'Timeout') throw err;
        const errMessage = formatErrorMessage(err);

        await this.botClient.sendMessage(this.userId, {
          message: (numberOfTries === 2) ? errMessage + '. Maximum number of tries reached. Try again later.' : errMessage
        });

        if (numberOfTries < 2) {
          numberOfTries++;
          return false;
        }

        throw err;
      }
    });
  }
}
