import { Api } from 'telegram';
import { SendMessageParams } from 'telegram/client/messages.js';
import { NewMessage, NewMessageEvent } from 'telegram/events/index.js';
import { HelperException } from '../exceptions.js';
import { getClient, userState } from '../states/index.js';
import { formatErrorMessage } from '../utils.js';

export async function userInputHandler(
  userId: bigInt.BigInteger,
  sendMessageParams?: SendMessageParams,
  deleteInputMessage = true,
  isCode = false
): Promise<string> {
  let inputMessage = '';
  const client = getClient();
  const timespan = 180000; // 3 minutes
  const inputHandler = {
    callback: async function (event: NewMessageEvent) {
      if (!userState.get(userId.toString(), 'userInputNotResolved')) return;

      inputMessage = isCode ? event.message.text.replaceAll(' ', '') : event.message.text;
      if (deleteInputMessage) {
        await event.message.delete({ revoke: true });
      }
    },
    event: new NewMessage({ fromUsers: [userId], incoming: true }),
  };
  userState.set(userId.toString(), 'userInputNotResolved', true);

  if (sendMessageParams) {
    await client.sendMessage(userId, sendMessageParams);
  }
  client.addEventHandler(inputHandler.callback, inputHandler.event);

  inputMessage = await Promise.race([
    new Promise<string>((resolve) => setTimeout(() => resolve(''), timespan)), // Timeout promise
    new Promise<string>((resolve) => {
      const interval = setInterval(() => {
        if (inputMessage) {
          clearInterval(interval);
          resolve(inputMessage);
        }
      }, 1000); // Check for input every 1000 ms
    }),
  ]);

  userState.deleteStateProperty(userId.toString(), 'userInputNotResolved');
  client.removeEventHandler(inputHandler.callback, inputHandler.event);

  if (!inputMessage) {
    throw new HelperException('Timeout');
  }

  return inputMessage;
}

export async function tryInputThreeTimes(
  userId: bigInt.BigInteger,
  sendMessageParams?: SendMessageParams,
  validationFn: (input: string) => Promise<boolean> = async (input) => input !== ''
): Promise<string> {
  let inputMessage = '';
  const client = getClient();
  for (let i = 0; i <= 2; i++) {
    try {
      inputMessage = await userInputHandler(userId, sendMessageParams);
      if (await validationFn(inputMessage)) break;
    } catch (err) {
      inputMessage = '';
      if (err instanceof Error && err.message !== 'Timeout') {
        const msg = (i === 2) ? '. Maximum number of tries reached. Try again later.' : '. Try again.';
        await client.sendMessage(userId, { message: formatErrorMessage(err) + msg });
      } else {
        throw err;
      }
    }
  }
  return inputMessage;
}

export function setDataToButtonCallback(button: Api.KeyboardButtonCallback, data: string | number) {
  if (button.data) {
    const dataStr = button.data.toString();
    const dataStrArr = dataStr.split(':');
    if (dataStrArr.length === 2 || dataStrArr.length === 3) {
      button.data = Buffer.from(`${dataStrArr[0]}:${dataStrArr[1]}:${data}`);
    }
  }
  return button;
}

export function getDataFromButtonCallback(data: Buffer): {
  className: string,
  handlerName: string,
  extraData: string
} {
  const dataStr = data.toString();
  const dataStrArr = dataStr.split(':');
  if (dataStrArr.length === 2) {
    return {
      className: dataStrArr[0],
      handlerName: dataStrArr[1],
      extraData: ''
    };
  } else if (dataStrArr.length === 3) {
    return {
      className: dataStrArr[0],
      handlerName: dataStrArr[1],
      extraData: dataStrArr[2]
    };
  } else {
    throw new HelperException(`Invalid button callback data: ${dataStr}`);
  }
}

export * as CommandHelper from './command.helper.js';
