import { DecoratorError } from '../exceptions';
import { handlerKeys } from '../keys';
import { Buttons, HandlerParams } from '../types';

export function buttonsReg<This, Return extends Buttons>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Return>
) {
  if (context.kind !== 'field') {
    throw new DecoratorError(`'buttonsReg' can only decorate fields not: ${context.kind}`);
  }

  return function (this: This, initialValue: Return): Return {
    const className = (<Record<string, string>>this)?.constructor?.name;

    initialValue.map((row) => {
      row.map((button) => {
        const handlerName = button?.data?.toString().split(':')[0];
        if (!(<Record<symbol, Map<string, HandlerParams>>>this)[handlerKeys.callbackQuery]?.has(handlerName)) {
          throw new DecoratorError(`'${className}.${<string>context.name}' has a button with data '${handlerName}' that is not a callbackQueryHandler.`);
        }
        button.data = Buffer.from(`${className}:${button.data}`);
        return button;
      });
    });
    return initialValue;
  };
}
