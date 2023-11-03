import { DecoratorException } from '../exceptions.js';
import { handlerKeys } from '../keys.js';
import { Buttons, ExtendedCommand } from '../types.js';

export function buttonsReg<This, Return extends Buttons>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Return>
) {
  if (context.kind !== 'field') {
    throw new DecoratorException(`'buttonsReg' can only decorate fields not: ${context.kind}`);
  }

  return function (this: This, initialValue: Return): Return {
    const className = (<Record<string, string>>this)?.constructor?.name;

    initialValue.map((row) => {
      row.map((button) => {
        const handlerName = button?.data?.toString().split(':')[0];
        if (!(<ExtendedCommand>this)[handlerKeys.callbackQuery]?.has(handlerName)) {
          throw new DecoratorException(`'${className}.${context.name.toString()}' has a button with data '${handlerName}' that is not a callbackQueryHandler.`);
        }
        button.data = Buffer.from(`${className}:${button.data}`);
        return button;
      });
    });
    return initialValue;
  };
}
