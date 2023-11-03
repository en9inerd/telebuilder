import { DecoratorException } from '../exceptions.js';
import { ClassType } from '../keys.js';
import { container } from '../states/container.js';
import { Constructor } from '../types.js';

export function inject<This, Return>(
  serviceIdentifier: Constructor<Return>
) {
  return function (
    target: undefined,
    context: ClassFieldDecoratorContext<This, Return>
  ) {
    if (context.kind !== 'field') {
      throw new DecoratorException(`'inject' can only decorate fields not: ${context.kind}`);
    }

    return function (this: This): Return {
      return container.resolve<Return>(serviceIdentifier, ClassType.Service);
    };
  };
}

