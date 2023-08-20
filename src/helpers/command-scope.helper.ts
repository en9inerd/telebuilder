import { Command, CommandScope, CommandScopeNames, GroupedCommandScopes } from '../types';

export function convertScopeStrToObject(scopeStr: string): CommandScope {
  return scopeStr.split(':').reduce((map, s) => {
    const [key, value] = s.split('=');
    map[key as keyof CommandScope] = <CommandScopeNames>value;
    return map;
  }, <CommandScope>{});
}

export function groupCommandsByScope(commands: Command[]): GroupedCommandScopes {
  return commands.reduce((map, c) => {
    for (const scope of c.scopes) {
      const scopeStr =
        `name=${scope.name}` +
        ('peer' in scope ? `:peer=${scope.peer}` : '') +
        ('userId' in scope ? `:userId=${scope.userId}` : '');

      if (!(scopeStr in map)) map[scopeStr] = {};

      for (const langCode of c.langCodes) {
        if (!(langCode in map[scopeStr])) map[scopeStr][langCode] = [];
        map[scopeStr][langCode].push(c.command);
      }
    }
    return map;
  }, <GroupedCommandScopes>{});
}

export * as CSHelper from './command-scope.helper';
