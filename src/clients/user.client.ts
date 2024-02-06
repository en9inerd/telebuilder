import { TelegramClientException } from '../exceptions.js';
import { input } from '../helpers/input.helper.js';
import { Store } from '../helpers/store.helper.js';
import { ClientParams } from '../types.js';
import { formatErrorMessage } from '../utils.js';
import { TelegramBotClient } from './bot.client.js';

export class TelegramUserClient extends TelegramBotClient {
  constructor(protected override readonly params: ClientParams) {
    super(params);
  }

  protected override async initUserBot(): Promise<void> {
    await this.start({
      phoneNumber: async () => await input.text('Enter your phone number: '),
      password: async () => await input.password('Enter your password: '),
      phoneCode: async () => await input.text('Enter the code sent to your phone: '),
      onError: async (err) => {
        const errMessage = formatErrorMessage(err);

        if (errMessage === 'Input closed unexpectedly') {
          process.stdout.write('\n');
        }

        input.close();
        throw new TelegramClientException(errMessage);
      }
    });

    input.close();

    // Save the session if it doesn't exist
    if (!Store.get(this.sessionName, '')) {
      Store.set(this.sessionName, this.session.save());
    }

    // Register event handlers
    this.registerEventHandlers();
  }
}
