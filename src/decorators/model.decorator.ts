/* eslint-disable @typescript-eslint/no-explicit-any */
import { DecoratorError } from '../exceptions';
import { ClassType } from '../keys';
import { container } from '../states/container';
import { Constructor, ModelDecoratorParams } from '../types';
import { addS } from '../utils';

export function model<Class extends Constructor<any>>(params: ModelDecoratorParams) {
  return function (
    target: Class,
    context: ClassDecoratorContext<Class>
  ) {
    if (context.kind !== 'class') {
      throw new DecoratorError(`'model' can only decorate classes not: ${context.kind}`);
    }

    const instance = new target();
    Object.defineProperty(instance, '$collectionName', {
      get: () => params?.collectionName || addS(target.name),
    });
    Object.defineProperty(instance, '$jsonSchema', {
      get: () => params?.jsonSchema || {},
    });

    container.register(target, instance, ClassType.Model);
  };
}
