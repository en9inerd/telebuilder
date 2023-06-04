import StateManager from '../states';

export function boundAndLocked<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  bound(target, context);
  if (context.kind !== 'method') {
    throw new Error(`'boundAndLocked' can only decorate methods not: ${context.kind}`);
  }

  async function replacementMethod(this: This, ...args: Args): Promise<void | Awaited<Return>> {
    const senderId = args[0]?.message?.senderId || args[0]?.senderId;
    const lockCondition = args.length === 1 && senderId;
    if (lockCondition) {
      if (StateManager.get('user').get(senderId, 'commandLock')) {
        await args[0]?.answer?.();
        return;
      }

      StateManager.get('user').set(senderId, 'commandLock', true);
    }

    // execute the method
    let result;
    try {
      result = await target.apply(this, args);
    } catch (err) {
      if (lockCondition) StateManager.get('user').deleteStateProperty(senderId, 'commandLock');
      throw err;
    }

    // execute something after the method call
    if (lockCondition) StateManager.get('user').deleteStateProperty(senderId, 'commandLock');
    return result;
  }

  return replacementMethod;
}

export function bound<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);
  if (context.private) {
    throw new Error(`'bound' or 'boundAndLocked' cannot decorate private properties like ${methodName}.`);
  }

  context.addInitializer(function (this: This) {
    (<Record<string, unknown>>this)[methodName] = (<Record<string, CallableFunction>>this)[methodName].bind(this);
  });
}
