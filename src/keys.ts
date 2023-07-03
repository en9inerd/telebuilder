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

// symbol keys
export const callbackQueryHandlerNames = Symbol('callbackQueryHandlerNames');
export const mongodbModels = Symbol('mongodbModels');

export enum ClassType {
  Service,
  Command,
  Model,
}
