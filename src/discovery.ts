/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Command } from './types';
import { sync as globSync } from 'glob';
import { parse as parseJSON } from 'json5';
import { Logger } from 'telegram';

function getRootAppDir(): string {
  const appDir = process.env.NODE_PATH || process.env.PWD;
  if (!appDir) {
    throw new Error('Cannot find app directory');
  }
  return appDir;
}

function getTSConfig(): any | undefined {
  const tsConfigPath = join(getRootAppDir(), 'tsconfig.json');
  try {
    const tsConfig = readFileSync(tsConfigPath, 'utf8');
    return parseJSON(tsConfig);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return;
    }
    throw err;
  }
}

function validateCommands(commands: Command[], logger: Logger): void {
  for (const c of commands) {
    if (!c.command) {
      logger.error(`'command' property of ${c.name} class can't be empty string or undefined`);
      process.exit(1);
    }
    if (!c.langCodes?.length) c.langCodes = [''];
    if (!c.scopes?.length) c.scopes = [{ name: 'Default' }];
    if (!c.description) c.description = `"${c.command}" command description `;
    if (!c.usage) c.usage = `"${c.command}" command usage `;
  }
}

export function discoverCommands(logger: Logger): Command[] {
  const outDir = resolve(
    getRootAppDir(),
    getTSConfig()?.compilerOptions?.outDir || ''
  );
  const commandFiles = globSync('**/*.command.js', {
    cwd: outDir,
    absolute: true,
    nodir: true,
    ignore: '**/node_modules/**'
  });

  const commands = commandFiles.map((filePath) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const commandModule = require(filePath);

    if (Object.keys(commandModule).length !== 1) {
      logger.error(`Command module '${filePath}' must have only one named export or export default`);
      process.exit(1);
    }
    return new commandModule[Object.keys(commandModule)[0]]();
  });
  validateCommands(commands, logger);

  return commands;
}
