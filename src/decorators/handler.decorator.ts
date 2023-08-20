/* eslint-disable @typescript-eslint/no-explicit-any */
import { DecoratorError } from '../exceptions';
import { handlerKeys } from '../keys';
import { HandlerParams, HandlerType } from '../types';
import { bound, locked } from './bound-and-locked.decorator';

export function handler<This, Args extends any[], Return>(type?: HandlerType, lock = true, params?: HandlerParams) {
  return function (
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {
    if (context.kind !== 'method') {
      throw new DecoratorError(`'handler' can only decorate methods not: ${context.kind}`);
    }

    context.addInitializer(function (this: This) {
      if (context.name === 'entryHandler' && !type) return;

      const handlerKey = (type) ? handlerKeys[type] : null;
      if (!handlerKey) {
        throw new DecoratorError(`'handler' decorator does not support type: ${type}`);
      }

      if (!((<Record<symbol, Map<string, HandlerParams>>>this)[handlerKey])) {
        (<Record<symbol, Map<string, HandlerParams>>>this)[handlerKey] = new Map<string, HandlerParams>();
      }

      (<Record<symbol, Map<string, HandlerParams>>>this)[handlerKey].set(context.name.toString(), params);
    });

    if (lock) {
      return bound(locked(target, context) as (this: This, ...args: Args) => Return, context);
    } else {
      return bound(target, context);
    }
  };
}
