import { DecoratorException } from "../exceptions.js";
import { userState } from "../states/index.js";

export function catchError<This, Args extends any[], Return>(
  callback?: (error: Error) => Promise<void>
) {
  return function (
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new DecoratorException(`'catchError' can only decorate methods not: ${context.kind}`);
    }

    async function replacementMethod(this: This, ...args: Args): Promise<void | Awaited<Return>> {
      try {
        return await target.apply(this, args);
      } catch (e) {
        const senderId = String(args[0]?.message?.senderId || args[0]?.senderId || '');
        userState.deleteStateProperty(senderId, 'commandLock');
        if (callback) {
          await callback(<Error>e);
        } else {
          console.error(e);
        }
      }
    }
    // change replacementMethod name to the original method name
    Object.defineProperty(replacementMethod, 'name', { value: context.name.toString() });

    return replacementMethod;
  }
}
