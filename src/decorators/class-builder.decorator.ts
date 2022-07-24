/* eslint-disable @typescript-eslint/no-explicit-any */
import { MethodBuilder } from './method-builder.decorator';

export function ClassBuilder<T extends { new(...args: any[]): any }>(constructor: T) {
  for (const propertyName of Object.getOwnPropertyNames(constructor.prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, propertyName);
    if (propertyName === 'constructor' || !descriptor || !(descriptor.value instanceof Function)) continue;

    Object.defineProperty(constructor.prototype, propertyName, MethodBuilder(constructor, propertyName, descriptor));
  }
  return constructor;
}
