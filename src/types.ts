import type { Api, Logger } from 'telegram';
import type { NewMessageEvent } from 'telegram/events';
import type { commandScopeMap, handlerKeys } from './keys.js';
import type { NewMessageInterface } from 'telegram/events/NewMessage.js';
import type { NewCallbackQueryInterface } from 'telegram/events/CallbackQuery.js';
import type { DefaultEventInterface } from 'telegram/events/common.js';
import type { EditedMessageInterface } from 'telegram/events/EditedMessage.js';
import type { RawInterface } from 'telegram/events/Raw.js';
import type { BaseDBService } from './services/index.js';

export type Dict<T = unknown> = Record<string, T>;

export type ClientParams = {
  commands: Constructor<Command>[];
  baseLogger?: Logger;
  dbService?: Constructor<BaseDBService>;
};

export type GroupedCommandScopes = Record<string, Record<string, string[]>>;

export interface Command {
  readonly command: string;
  description: string;
  scopes: CommandScope[];
  langCodes: string[];
  params?: CommandParamsSchema;
  entryHandler: EntryHandler;
}

export type ParamType = 'string' | 'number' | 'boolean' | 'enum';
export type ParamSchema = {
  type: ParamType;
  enumValues?: string[];
  required?: boolean;
  default?: string | number | boolean;
};

export type CommandParamsSchema = Dict<ParamSchema>;

export type ValidatedCommandParams = Dict<string | number | boolean>;

export type MessageWithParams<T = unknown> = Api.Message & { params?: T };

export type ExtendedCommand = Command & Record<symbol, Map<string, EventInterface>> & Record<string, CommandHandler>;

export type CommandHandler = () => Promise<void>;

export type EntryHandler = (event: NewMessageEvent) => Promise<void>;

export type CommandScopeNames = keyof typeof commandScopeMap;

export type CommandScope =
  | {
    name: 'Default' | 'Users' | 'Chats' | 'ChatAdmins';
  }
  | {
    name: 'Peer' | 'PeerAdmins';
    peer: string;
  }
  | {
    name: 'PeerUser';
    peer: string;
    userId: string;
  };

export type Buttons = Api.KeyboardButtonCallback[][];

// biome-ignore lint/suspicious/noExplicitAny: really any type
export type Constructor<T> = new (...args: any[]) => T;

export type HandlerType = keyof typeof handlerKeys;
export enum HandlerTypes {
  NewMessage = 'newMessage',
  EditedMessage = 'editedMessage',
  DeletedMessage = 'deletedMessage',
  CallbackQuery = 'callbackQuery',
  Album = 'album',
  Raw = 'raw',
}

export type HandlerDecoratorParams = {
  type?: HandlerType;
  lock?: boolean;
  validateCommandParams?: boolean;
  event?: EventInterface;
};

export type EventInterface = NewMessageInterface | NewCallbackQueryInterface | DefaultEventInterface | EditedMessageInterface | RawInterface;
