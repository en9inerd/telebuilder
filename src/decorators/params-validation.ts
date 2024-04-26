import type { NewMessageEvent } from 'telegram/events/NewMessage.js';
import { DecoratorException } from '../exceptions.js';
import { commandParamsSchema } from '../keys.js';
import type { CommandParamsSchema, MessageWithParams, ValidatedCommandParams } from '../types.js';

// biome-ignore lint/suspicious/noExplicitAny: really any type
export function paramsValidation<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  if (context.kind !== 'method') {
    throw new DecoratorException(`'paramsValidation' can only decorate methods not: ${context.kind}`);
  }

  async function replacementMethod(this: This, ...args: Args): Promise<undefined | Awaited<Return>> {
    const event: NewMessageEvent = args[0];
    if (event?.originalUpdate?.className !== 'UpdateNewMessage') return;

    const params = event?.message?.text?.split(' ').slice(1);

    if (commandParamsSchema in <Record<symbol, CommandParamsSchema>>this && params.length > 0) {
      const schema: CommandParamsSchema = (<Record<symbol, CommandParamsSchema>>this)[commandParamsSchema];

      const parsedParams = params.reduce((acc, param) => {
        const [key, value] = param.split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      let errorMsg = '';
      const validatedParams = Object.entries(schema).reduce((acc, [key, value]) => {
        if (value.required && !(key in parsedParams)) {
          errorMsg += `Param "${key}" is required.\n`;
        }

        if (key in parsedParams) {
          if (value.type === 'string') {
            acc[key] = parsedParams[key];
          } else if (value.type === 'number') {
            acc[key] = Number(parsedParams[key]);
            errorMsg += Number.isNaN(acc[key]) ? `Param '${key}' should be a number.\n` : '';
          } else if (value.type === 'boolean') {
            if (parsedParams[key] === 'true') {
              acc[key] = true;
            } else if (parsedParams[key] === 'false') {
              acc[key] = false;
            } else {
              errorMsg += `Param '${key}' should be a boolean: true or false.\n`;
            }
          } else if (value.type === 'enum') {
            if (value.enumValues?.includes(parsedParams[key])) {
              acc[key] = parsedParams[key];
            } else {
              errorMsg += `Param '${key}' should be one of: ${value.enumValues?.join(', ')}.\n`;
            }
          }
        } else if (value.default) {
          acc[key] = value.default;
        }

        return acc;
      }, {} as ValidatedCommandParams);

      if (errorMsg) {
        const senderId = String(event.message.senderId);
        await event?.client?.sendMessage(senderId, {
          message: errorMsg,
        });
        return;
      }

      (<MessageWithParams>event.message).params = validatedParams;
    }

    return await target.apply(this, args);
  }

  // change replacementMethod name to the original method name
  Object.defineProperty(replacementMethod, 'name', { value: context.name.toString() });

  return replacementMethod;
}
