/* eslint-disable @typescript-eslint/no-explicit-any */
import { DecoratorException } from '../exceptions.js';
import { getClient, userState } from '../states/index.js';
import { formatErrorMessage } from '../utils.js';

export function locked<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  if (context.kind !== 'method') {
    throw new DecoratorException(`'locked' can only decorate methods not: ${context.kind}`);
  }

  async function replacementMethod(this: This, ...args: Args): Promise<void | Awaited<Return>> {
    const senderId = String(args[0]?.message?.senderId || args[0]?.senderId || '');
    const lockCondition = args.length === 1 && senderId;
    if (lockCondition) {
      if (userState.get(senderId, 'commandLock')) {
        await args[0]?.answer?.();
        return;
      }

      userState.set(senderId, 'commandLock', true);
    }

    // execute the method
    let result;
    try {
      result = await target.apply(this, args);
    } catch (err: any) {
      const client = getClient();

      if (!(err)?.sendToUser) {
        client.logger.error(`User ID: '${senderId}', ${(err).name}: ${(err).message}`);
        console.error(err);
      }

      if (lockCondition) {
        let message;
        if ((err)?.sendToUser) {
          message = formatErrorMessage(err);
        } else {
          message = 'Something went wrong. Please try again later.';
        }
        await client.sendMessage(senderId, { message });

        userState.deleteStateProperty(senderId, 'commandLock');
      }
    }

    // execute something after the method call
    if (lockCondition) userState.deleteStateProperty(senderId, 'commandLock');
    return result;
  }

  // change replacementMethod name to the original method name
  Object.defineProperty(replacementMethod, 'name', { value: context.name.toString() });

  return replacementMethod;
}

export function bound<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = context.name.toString();

  if (context.private) {
    throw new DecoratorException(`'bound' cannot decorate private properties like ${methodName}.`);
  }

  context.addInitializer(function (this: This) {
    (<Record<string, unknown>>this)[methodName] = target.bind(this);
  });
}
