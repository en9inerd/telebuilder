/* eslint-disable @typescript-eslint/no-explicit-any */
import StateManager from './state';
import { isAsync } from './utils';

export function MethodBuilder(target: any, key: string | symbol, descriptor: PropertyDescriptor) {
  let fn = descriptor.value;

  if (typeof fn !== 'function') {
    throw new TypeError(`@boundMethod decorator can only be applied to methods not: ${typeof fn}`);
  }

  // behavior modification
  fn = async function (this: any, ...args: any[]) {

    // execute something before the method call
    const senderId = args[0]?.message?.senderId || args[0]?.senderId;
    const lockCondition = args.length === 1 && senderId;
    if (lockCondition) {
      if (StateManager.get(senderId).get('commandLock')) return;

      StateManager.get(senderId).set('commandLock', true);
    }

    // execute the method
    let result;
    try {
      result = (isAsync) ? await descriptor.value.apply(this, args) : descriptor.value.apply(this, args);
    } catch (err) {
      if (lockCondition) StateManager.get(senderId).set('commandLock', false);
      throw err;
    }

    // execute something after the method call
    if (lockCondition) StateManager.get(senderId).set('commandLock', false);
    return result;
  };

  return {
    configurable: true,
    get() {
      // eslint-disable-next-line no-prototype-builtins
      if (this === target.prototype || this.hasOwnProperty(key) || typeof fn !== 'function') {
        return fn;
      }

      const boundFn = fn.bind(this);
      Object.defineProperty(this, key, {
        configurable: true,
        get() {
          return boundFn;
        },
        set(value) {
          fn = value;
          delete this[key];
        }
      });
      return boundFn;
    },
    set(value: any) {
      fn = value;
    }
  };
}

export function ClassBuilder<T extends { new(...args: any[]): any }>(constructor: T) {
  for (const propertyName of Object.getOwnPropertyNames(constructor.prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, propertyName);
    if (propertyName === 'constructor' || !descriptor || !(descriptor.value instanceof Function)) continue;

    Object.defineProperty(constructor.prototype, propertyName, MethodBuilder(constructor, propertyName, descriptor));
  }
  return constructor;
}
