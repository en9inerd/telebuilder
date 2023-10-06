/* eslint-disable @typescript-eslint/no-explicit-any */
import { DecoratorError } from '../exceptions.js';
import { ClassType, clientInstanceFieldName } from '../keys.js';
import { container } from '../states/container.js';
import { Command, Constructor } from '../types.js';

export function command<Class extends Constructor<any>>(
  target: Class,
  context: ClassDecoratorContext<Class>
) {
  if (context.kind !== 'class') {
    throw new DecoratorError(`'command' can only decorate classes not: ${context.kind}`);
  }

  const instance = new target();
  validateCommand(instance);

  if (clientInstanceFieldName in instance) {
    Object.defineProperty(instance, instance[clientInstanceFieldName], {
      get: function () {
        return container.client;
      },
      configurable: false,
    });
  }

  container.register(target, instance, ClassType.Command);
}

function validateCommand(command: Command): void {
  if (!command.command) {
    throw new DecoratorError(`'command' field of ${command.constructor.name} class can't be empty string or undefined`);
  }
  if (!command.langCodes?.length) command.langCodes = [''];
  if (!command.scopes?.length) command.scopes = [{ name: 'Default' }];
  if (!command.description && command.description !== '') command.description = `"${command.command}" command description`;
  if (!command.entryHandler) {
    throw new DecoratorError(`'entryHandler' method of ${command.constructor.name} class can't be undefined`);
  }
}
