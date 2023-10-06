import { DecoratorError } from '../exceptions.js';
import { commandParamsSchema } from '../keys.js';
import { CommandParamsSchema } from '../types.js';

export function params<This, Return extends CommandParamsSchema>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Return>
) {
  if (context.kind !== 'field') {
    throw new DecoratorError(`'params' can only decorate fields not: ${context.kind}`);
  }

  const methodName = context.name.toString();

  return function (this: This, initialValue: Return): Return {
    if (!initialValue || typeof initialValue !== 'object' || !Object.keys(initialValue).length) {
      throw new DecoratorError(`field '${methodName}' of '${(<Record<string, string>>this)?.constructor?.name}' class can't be empty object or undefined`);
    }

    Object.values(initialValue).forEach((param) => {
      if (!param.type || !['string', 'number', 'boolean'].includes(param.type)) {
        throw new DecoratorError(`field '${methodName}' of '${(<Record<string, string>>this)?.constructor?.name}' class has unsupported type: ${param.type}`);
      }
    });

    if (!(<Record<symbol, CommandParamsSchema>>this)[commandParamsSchema]) {
      (<Record<symbol, CommandParamsSchema>>this)[commandParamsSchema] = initialValue;
    } else {
      throw new DecoratorError(`'params' can only decorate one field`);
    }

    return initialValue;
  };
}
