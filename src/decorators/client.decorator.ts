import { TelegramClient } from 'telegram';
import { DecoratorError } from '../exceptions';
import { clientInstancePropertyName } from '../keys';

export function client<This, Return extends TelegramClient>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Return>
) {
  if (context.kind !== 'field') {
    throw new DecoratorError(`'client' can only decorate fields not: ${context.kind}`);
  }

  context.addInitializer(function (this: This) {
    if (!(<Record<symbol, string>>this)[clientInstancePropertyName]) {
      (<Record<symbol, string>>this)[clientInstancePropertyName] = context.name.toString();
    } else {
      throw new DecoratorError(`'client' can only decorate one field`);
    }
  });
}

