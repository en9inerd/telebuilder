import { Api } from 'telegram';

export const commandScopeMap = {
  Default: Api.BotCommandScopeDefault,
  Users: Api.BotCommandScopeUsers,
  Chats: Api.BotCommandScopeChats,
  ChatAdmins: Api.BotCommandScopeChatAdmins,
  Peer: Api.BotCommandScopePeer,
  PeerAdmins: Api.BotCommandScopePeerAdmins,
  PeerUser: Api.BotCommandScopePeerUser,
};

export const handlerKeys = {
  callbackQuery: Symbol('callbackQueryHandlers'),
  raw: Symbol('rawHandlers'),
  newMessage: Symbol('newMessageHandlers'),
  editedMessage: Symbol('editedMessageHandlers'),
  deletedMessage: Symbol('deletedMessageHandlers'),
  album: Symbol('albumHandlers'),
};



export const clientInstance = Symbol('clientInstance');
export const clientInstancePropertyName = Symbol('clientInstancePropertyName');

export const callbackQueryHandlerNames = Symbol('callbackQueryHandlerNames');

export enum ClassType {
  Service,
  Command,
  Model,
}
