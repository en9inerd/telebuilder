/* eslint-disable @typescript-eslint/no-explicit-any */
import { DecoratorError } from '../exceptions';
import { ClassType } from '../keys';
import { container } from '../states/container';
import { Command, Constructor } from '../types';

export function command<Class extends Constructor<any>>(
  target: Class,
  context: ClassDecoratorContext<Class>
) {
  if (context.kind !== 'class') {
    throw new DecoratorError(`'command' can only decorate classes not: ${context.kind}`);
  }

  const instance = new target();
  validateCommand(instance);
  container.register(target, instance, ClassType.Command);
}

function validateCommand(command: Command): void {
  if (!command.command) {
    throw new DecoratorError(`'command' property of ${command.name} class can't be empty string or undefined`);
  }
  if (!command.langCodes?.length) command.langCodes = [''];
  if (!command.scopes?.length) command.scopes = [{ name: 'Default' }];
  if (!command.description) command.description = `"${command.command}" command description `;
  if (!command.usage) command.usage = `"${command.command}" command usage `;
}