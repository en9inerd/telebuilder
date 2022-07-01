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
