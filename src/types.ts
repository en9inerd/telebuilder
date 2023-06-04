import { NewMessageEvent } from 'telegram/events';
import { CallbackQueryEvent } from 'telegram/events/CallbackQuery';

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
  params?: { [key: string]: unknown };
  readonly callbackQueryHandlers?: CallbackQueryHandler[];
  defaultHandler?: (event: NewMessageEvent) => Promise<void>;
};

export type CallbackQueryHandler = {
  pattern?: RegExp;
  callback: (event: CallbackQueryEvent) => Promise<void>;
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
