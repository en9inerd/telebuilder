import { DecoratorException } from '../exceptions.js';
import { commandParamsSchema } from '../keys.js';
import type { CommandParamsSchema } from '../types.js';

export function params<This, Return extends CommandParamsSchema>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Return>
) {
  if (context.kind !== 'field') {
    throw new DecoratorException(`'params' can only decorate fields not: ${context.kind}`);
  }

  const methodName = context.name.toString();

  return function (this: This, initialValue: Return): Return {
    if (!initialValue || typeof initialValue !== 'object' || !Object.keys(initialValue).length) {
      throw new DecoratorException(`field '${methodName}' of '${(<Record<string, string>>this)?.constructor?.name}' class can't be empty object or undefined`);
    }

    for (const param of Object.values(initialValue)) {
      if (!param.type || !['string', 'number', 'boolean', 'enum'].includes(param.type)) {
        throw new DecoratorException(`field '${methodName}' of '${(<Record<string, string>>this)?.constructor?.name}' class has unsupported type: ${param.type}`);
      }

      if (param.type === 'enum' && !param.enumValues) {
        throw new DecoratorException(`field '${methodName}' of '${(<Record<string, string>>this)?.constructor?.name}' class has enum type but no enumValues`);
      }
    }

    if (!(<Record<symbol, CommandParamsSchema>>this)[commandParamsSchema]) {
      (<Record<symbol, CommandParamsSchema>>this)[commandParamsSchema] = initialValue;
    } else {
      throw new DecoratorException(`'params' can only decorate one field`);
    }

    return initialValue;
  };
}
