/* eslint-disable @typescript-eslint/no-explicit-any */
import { DecoratorError } from '../exceptions.js';
import { handlerKeys } from '../keys.js';
import { EventInterface, ExtendedCommand, HandlerDecoratorParams, HandlerTypes } from '../types.js';
import { bound, locked } from './bound-and-locked.decorator.js';
import { paramsValidation } from './params-validation.js';

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
      throw new DecoratorError(`'handler' can only decorate methods not: ${context.kind}`);
    }

    const methodName = context.name.toString();

    context.addInitializer(function (this: This) {
      if (methodName === 'entryHandler') type = HandlerTypes.NewMessage;

      if (!type) {
        throw new DecoratorError(`'handler' decorator requires a type for method: ${methodName}`);
      }

      const handlerKey = (type) ? handlerKeys[type] : null;
      if (!handlerKey) {
        throw new DecoratorError(`'handler' decorator does not support type: ${type}`);
      }

      if (!((<ExtendedCommand>this)[handlerKey])) {
        (<ExtendedCommand>this)[handlerKey] = new Map<string, EventInterface>();
      }

      (<ExtendedCommand>this)[handlerKey].set(methodName, event);
    });

    if (lock) {
      if (validateCommandParams && methodName === 'entryHandler') {
        return bound(
          paramsValidation(
            locked(target, context) as (this: This, ...args: Args) => Return, context
          ) as (this: This, ...args: Args) => Return, context
        );
      } else {
        return bound(locked(target, context) as (this: This, ...args: Args) => Return, context);
      }
    } else {
      return bound(target, context);
    }
  };
}
