/* eslint-disable @typescript-eslint/no-explicit-any */
import StateManager from '../states';
import { isAsync } from '../utils';

export function MethodBuilder(target: any, key: string | symbol, descriptor: PropertyDescriptor) {
  let fn = descriptor.value;

  if (typeof fn !== 'function') {
    throw new TypeError(`@MethodBuilder decorator can only be applied to methods not: ${typeof fn}`);
  }

  // behavior modification
  fn = async function (this: any, ...args: any[]) {

    // execute something before the method call
    const senderId = args[0]?.message?.senderId || args[0]?.senderId;
    const lockCondition = args.length === 1 && senderId;
    if (lockCondition) {
      if (StateManager.get('user').get(senderId, 'commandLock')) return;

      StateManager.get('user').set(senderId, 'commandLock', true);
    }

    // execute the method
    let result;
    try {
      result = (isAsync) ? await descriptor.value.apply(this, args) : descriptor.value.apply(this, args);
    } catch (err) {
      if (lockCondition) StateManager.get('user').deleteStateProperty(senderId, 'commandLock');
      throw err;
    }

    // execute something after the method call
    if (lockCondition) StateManager.get('user').deleteStateProperty(senderId, 'commandLock');
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
