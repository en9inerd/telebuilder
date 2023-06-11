/* eslint-disable @typescript-eslint/no-explicit-any */
import { DecoratorError } from '../exceptions';
import { ModelParams } from '../types';
import { addS } from '../utils';

export function model<Class extends new (...args: any[]) => any>(params: ModelParams) {
  return function (
    target: Class,
    context: ClassDecoratorContext<Class>
  ) {
    if (context.kind !== 'class') {
      throw new DecoratorError(`'model' can only decorate classes not: ${context.kind}`);
    }

    context.addInitializer(function (this: Class) {
      Object.defineProperty(this, 'collectionName', {
        get: () => params?.collectionName || addS(this.name),
      });
      Object.defineProperty(this, 'jsonSchema', {
        get: () => params?.jsonSchema || {},
      });
    });
  };
}
