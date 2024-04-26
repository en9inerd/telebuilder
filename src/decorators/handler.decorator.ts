import { DecoratorException } from '../exceptions.js';
import { handlerKeys } from '../keys.js';
import { type EventInterface, type ExtendedCommand, type HandlerDecoratorParams, HandlerTypes } from '../types.js';
import { bound, locked } from './bound-and-locked.decorator.js';
import { paramsValidation } from './params-validation.js';

// biome-ignore lint/suspicious/noExplicitAny: really any type
export function handler<This, Args extends any[], Return>(params: HandlerDecoratorParams = {}) {
  return function (
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    const {
      lock = true,
      validateCommandParams = true,
      event = {}
    } = params;
    let { type } = params;

    if (context.kind !== 'method') {
      throw new DecoratorException(`'handler' can only decorate methods not: ${context.kind}`);
    }

    const methodName = context.name.toString();

    context.addInitializer(function (this: This) {
      if (methodName === 'entryHandler') type = HandlerTypes.NewMessage;

      if (!type) {
        throw new DecoratorException(`'handler' decorator requires a type for method: ${methodName}`);
      }

      const handlerKey = (type) ? handlerKeys[type] : null;
      if (!handlerKey) {
        throw new DecoratorException(`'handler' decorator does not support type: ${type}`);
      }

      if (!((<ExtendedCommand>this)[handlerKey])) {
        (<ExtendedCommand>this)[handlerKey] = new Map<string, EventInterface>();
      }

      (<ExtendedCommand>this)[handlerKey].set(methodName, event);
    });

    if (lock) {
      const fnToLock = validateCommandParams && methodName === 'entryHandler'
        ? paramsValidation(locked(target, context) as (this: This, ...args: Args) => Return, context)
        : locked(target, context);
      return bound(fnToLock as (this: This, ...args: Args) => Return, context);
    } else {
      const fnToUse = validateCommandParams && methodName === 'entryHandler'
        ? paramsValidation(target, context)
        : target;
      return bound(fnToUse as (this: This, ...args: Args) => Return, context);
    }

  };
}
