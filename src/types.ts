import { Api } from 'telegram';
import { NewMessageEvent } from 'telegram/events';

export type TSConfig = {
  compilerOptions: {
    outDir: string;
  };
};

export type Dictionary = Record<string, unknown>;

export type GroupedCommandScopes = Record<string, Record<string, string[]>>;

export type Command = {
  readonly name?: string; // to get class name
  readonly command: string;
  description: string;
  usage: string;
  scopes: CommandScope[];
  langCodes: string[];
  params?: Dictionary;
  defaultHandler?: (event: NewMessageEvent) => Promise<void>;
};

export type CommandScopeNames = 'Default' | 'Users' | 'Chats' | 'ChatAdmins' | 'Peer' | 'PeerAdmins' | 'PeerUser';

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

export type StateType = 'user' | 'chat';

export type Buttons = Api.KeyboardButtonCallback[][];

export type HydratedModel<T> = T & Required<ModelParams>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModelClass = HydratedModel<new (...args: any[]) => any>;

export type ModelParams = {
  collectionName?: string;
  jsonSchema?: Record<string, unknown>;
};
