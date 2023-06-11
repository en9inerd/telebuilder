/* eslint-disable @typescript-eslint/no-explicit-any */
import { DecoratorError } from '../exceptions';
import { callbackQueryHandlerNames } from '../keys';

export function callbackQueryHandler<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  if (context.kind !== 'method') {
    throw new DecoratorError(`'callbackQueryHandler' can only decorate methods not: ${context.kind}`);
  }

  context.addInitializer(function (this: This) {
    if (!(<Record<symbol, Set<string>>>this)[callbackQueryHandlerNames]) {
      (<Record<symbol, Set<string>>>this)[callbackQueryHandlerNames] = new Set<string>();
    }

    (<Record<symbol, Set<string>>>this)[callbackQueryHandlerNames].add(context.name.toString());
  });
}
