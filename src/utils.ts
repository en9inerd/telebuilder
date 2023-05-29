import { TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Command, CommandScope, CommandScopeNames, GroupedCommandScopes } from './types';

export function convertScopeStrToObject(scopeStr: string): CommandScope {
  return scopeStr.split(':').reduce((map, s) => {
    const [key, value] = s.split('=');
    map[key as keyof CommandScope] = <CommandScopeNames>value;
    return map;
  }, <CommandScope>{});
}

export function groupCommandsByScope(commands: Command[]): GroupedCommandScopes {
  return commands.reduce((map, c) => {
    for (const scope of c.scopes) {
      const scopeStr =
        `name=${scope.name}` +
        ('peer' in scope ? `:peer=${scope.peer}` : '') +
        ('userId' in scope ? `:userId=${scope.userId}` : '');

      if (!(scopeStr in map)) map[scopeStr] = {};

      for (const langCode of c.langCodes) {
        if (!(langCode in map[scopeStr])) map[scopeStr][langCode] = [];
        map[scopeStr][langCode].push(c.command);
      }
    }
    return map;
  }, <GroupedCommandScopes>{});
}

export async function inputSecret(
  client: TelegramClient,
  message: string,
  userId: string | bigInt.BigInteger,
): Promise<string> {
  let inputMessage = '';
  const timespan = 300000; // 5 minutes
  const timeMax = new Date().getTime() + timespan;
  const inputHandler = {
    callback: async (event: NewMessageEvent) => {
      inputMessage = message.includes('code') ? event.message.text.replaceAll(' ', '') : event.message.text;
      await event.message.delete({ revoke: true });
    },
    event: new NewMessage({ fromUsers: [userId] }),
  };

  await client.sendMessage(userId, { message });
  client.addEventHandler(inputHandler.callback, inputHandler.event);

  do {
    await new Promise((resolve) => setTimeout(resolve, 2500));
  } while (!inputMessage && new Date().getTime() < timeMax);

  client.removeEventHandler(inputHandler.callback, inputHandler.event);

  if (!inputMessage) {
    await client.sendMessage(userId, { message: 'Timeout' });
    throw new Error('inputSecret: Timeout');
  }

  return inputMessage;
}

export async function tryInputThreeTimes(
  client: TelegramClient,
  message: string,
  userId: string | bigInt.BigInteger,
  callback: (input: string) => Promise<boolean>
): Promise<string> {
  let inputMessage = '';
  for (let i = 0; i <= 2; i++) {
    try {
      inputMessage = await inputSecret(client, message, userId);
      if (await callback(inputMessage)) break;
    } catch (err) {
      inputMessage = '';
      if (err instanceof Error && err.message !== 'inputSecret: Timeout') {
        const msg = (i === 2) ? '. Maximum number of tries reached. Try again later.' : '. Try again.';
        await client.sendMessage(userId, { message: formatErrorMessage(err) + msg });
      } else {
        break;
      }
    }
  }
  return inputMessage;
}

export function formatErrorMessage(err: Error): string {
  return 'Error: ' + err.message.split(' (')[0];
}

export function isAsync(fn: CallableFunction): boolean {
  return (
    fn.constructor.name === 'AsyncFunction' ||
    Object.prototype.toString.call(fn) === '[object AsyncFunction]' ||
    fn instanceof Promise ||
    (fn !== null && typeof fn === 'object' && typeof (<Promise<unknown>>fn).then === 'function' && typeof (<Promise<unknown>>fn).catch === 'function')
  );
}

export function addS(modelClass: object): string {
  const word = modelClass.constructor.name.toLowerCase();
  const exceptions = ['s', 'x', 'z', 'ch', 'sh'];

  if (exceptions.some(ex => word.endsWith(ex))) {
    return word + 'es';
  } else if (word.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2])) {
    return word.slice(0, -1) + 'ies';
  } else {
    return word + 's';
  }
}

export * as Utils from './utils';
