import { DecoratorError } from '../exceptions';
import { ClassType } from '../keys';
import { container } from '../states/container';
import { Constructor } from '../types';

export function inject<This, Return>(
  serviceIdentifier: Constructor<Return>
) {
  return function (
    target: undefined,
    context: ClassFieldDecoratorContext<This, Return>
  ) {
    if (context.kind !== 'field') {
      throw new DecoratorError(`'inject' can only decorate fields not: ${context.kind}`);
    }

    return function (this: This): Return {
      return container.resolve<Return>(serviceIdentifier, ClassType.Service);
    };
  };
}

