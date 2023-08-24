import { Api } from 'telegram';
import { NewMessageEvent } from 'telegram/events';
import { commandScopeMap, handlerKeys } from './keys.js';
import { NewMessageInterface } from 'telegram/events/NewMessage.js';
import { NewCallbackQueryInterface } from 'telegram/events/CallbackQuery.js';
import { DefaultEventInterface } from 'telegram/events/common.js';
import { EditedMessageInterface } from 'telegram/events/EditedMessage.js';
import { RawInterface } from 'telegram/events/Raw.js';

export type Dictionary = Record<string, unknown>;

export type GroupedCommandScopes = Record<string, Record<string, string[]>>;

export type Command = {
  readonly command: string;
  description: string;
  usage: string;
  scopes: CommandScope[];
  langCodes: string[];
  entryHandler: (event: NewMessageEvent) => Promise<void>;
};
export type ExtendedCommand = Command & Record<symbol, Map<string, HandlerParams>> & Record<string, CommandHandler>;

export type CommandHandler = () => Promise<void>;

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

export type HydratedModel<T> = T & Required<ModelParams>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericModel = HydratedModel<any>;

export type ModelParams = {
  $collectionName?: string;
  $jsonSchema?: Dictionary;
};

export type ModelDecoratorParams = {
  collectionName?: string;
  jsonSchema?: Dictionary;
};

export type HandlerType = keyof typeof handlerKeys;
export enum HandlerTypes {
  NewMessage = 'newMessage',
  EditedMessage = 'editedMessage',
  DeletedMessage = 'deletedMessage',
  CallbackQuery = 'callbackQuery',
  Album = 'album',
  Raw = 'raw',
}

export type HandlerParams = NewMessageInterface | NewCallbackQueryInterface | DefaultEventInterface | EditedMessageInterface | RawInterface | undefined;
