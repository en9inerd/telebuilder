import { TelegramClient } from 'telegram';
import { DecoratorException } from '../exceptions.js';
import { clientInstanceFieldName } from '../keys.js';

export function client<This, Return extends TelegramClient>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Return>
) {
  if (context.kind !== 'field') {
    throw new DecoratorException(`'client' can only decorate fields not: ${context.kind}`);
  }

  context.addInitializer(function (this: This) {
    if (!(<Record<symbol, string>>this)[clientInstanceFieldName]) {
      (<Record<symbol, string>>this)[clientInstanceFieldName] = context.name.toString();
    } else {
      throw new DecoratorException(`'client' can only decorate one field`);
    }
  });
}

