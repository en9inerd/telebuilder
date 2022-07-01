import config from 'config';
import { TelegramClient } from 'telegram';
import { Session } from 'telegram/sessions';
import { Utils } from '../utils';

export class TelegramUserClient extends TelegramClient {

  constructor(
    public session: Session,
    private readonly userId: bigInt.BigInteger,
    private readonly botClient: TelegramClient
  ) {
    super(
      session,
      config.get('botConfig.apiId'),
      config.get('botConfig.apiHash'),
      {
        baseLogger: botClient.logger,
        connectionRetries: config.get('botConfig.connectionRetries'),
        deviceModel: config.get('botConfig.deviceModel'),
        appVersion: config.get('botConfig.appVersion'),
        systemVersion: config.get('botConfig.systemVersion'),
        langCode: config.get('botConfig.langCode'),
        systemLangCode: config.get('botConfig.systemLangCode')
      }
    );
  }

  public async init(): Promise<void> {
    let numberOfTries = 0;

    await this.start({
      phoneNumber: async () => await Utils.inputSecret(this.botClient, 'Enter your phone number:', this.userId),
      password: async () => await Utils.inputSecret(this.botClient, 'Enter your password:', this.userId),
      phoneCode: async () => await Utils.inputSecret(this.botClient, 'Enter the code you received:', this.userId),
      onError: async (err) => {
        if (err.message === 'inputSecret: Timeout') throw err;
        const errMessage = Utils.formatErrorMessage(err);

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
