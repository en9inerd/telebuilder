import { DecoratorError } from '../exceptions';
import { ClassType } from '../keys';
import { container } from '../states/container';
import { Constructor } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function injectable<Class extends Constructor<any>>(
  target: Class,
  context: ClassDecoratorContext<Class>
) {
  if (context.kind !== 'class') {
    throw new DecoratorError(`'injectable' can only decorate classes not: ${context.kind}`);
  }

  container.register(target, new target(), ClassType.Service);
}
