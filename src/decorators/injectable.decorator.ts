import { DecoratorException } from '../exceptions.js';
import { ClassType, clientInstanceFieldName } from '../keys.js';
import { container } from '../states/container.js';
import type { Constructor } from '../types.js';

// biome-ignore lint/suspicious/noExplicitAny: really any type
export function injectable<Class extends Constructor<any>>(
  target: Class,
  context: ClassDecoratorContext<Class>
) {
  if (context.kind !== 'class') {
    throw new DecoratorException(`'injectable' can only decorate classes not: ${context.kind}`);
  }

  const instance = new target();

  if (clientInstanceFieldName in instance) {
    Object.defineProperty(instance, instance[clientInstanceFieldName], {
      get: function () {
        return container.client;
      },
      configurable: false,
    });
  }

  container.register(target, instance, ClassType.Service);
}
