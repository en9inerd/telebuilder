import { access, readFile } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { Command, TSConfig } from './types';
import { sync as globSync } from 'glob';
import { parse as parseJSON } from 'json5';
import { DiscoveryException } from './exceptions';

async function getRootAppDir(): Promise<string> {
  const appDir = process.env.PWD;
  if (appDir) {
    return appDir;
  }

  let dir = __dirname;
  if (dir.includes('node_modules')) {
    dir = dir.split('node_modules')[0];
  }

  let dirFound = false;
  while (true) {
    try {
      await access(join(dir, 'package.json'));
      dirFound = true;
      break;
    } catch (error) {
      const parentDir = dirname(dir);
      if (parentDir === dir) {
        break;
      }
      dir = parentDir;
    }
  }

  if (dirFound) {
    return dir;
  }

  throw new DiscoveryException('Cannot find root app directory');
}

async function getTSConfig(): Promise<TSConfig | void> {
  const tsConfigPath = join(await getRootAppDir(), 'tsconfig.json');
  try {
    const tsConfig = await readFile(tsConfigPath, 'utf8');
    return parseJSON(tsConfig);
  } catch (err: unknown) {
    if ((<{ code: string }>err).code === 'ENOENT') {
      return;
    }
    throw err;
  }
}

function validateCommands(commands: Command[]): void {
  for (const c of commands) {
    if (!c.command) {
      throw new DiscoveryException(`'command' property of ${c.name} class can't be empty string or undefined`);
    }
    if (!c.langCodes?.length) c.langCodes = [''];
    if (!c.scopes?.length) c.scopes = [{ name: 'Default' }];
    if (!c.description) c.description = `"${c.command}" command description `;
    if (!c.usage) c.usage = `"${c.command}" command usage `;
  }
}

async function discover<T>(pattern: string, instantiate = false, validator?: CallableFunction): Promise<T[]> {
  const outDir = resolve(
    await getRootAppDir(),
    (await getTSConfig())?.compilerOptions?.outDir || ''
  );
  const files = globSync(pattern, {
    cwd: outDir,
    absolute: true,
    nodir: true,
    ignore: '**/node_modules/**'
  });

  const instancesOrClasses: T[] = files.map((filePath) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(filePath);

    if (Object.keys(module).length !== 1) {
      throw new DiscoveryException(`Command module '${filePath}' must have only one named export or export default`);
    }

    return instantiate ? new module[Object.keys(module)[0]]() : module[Object.keys(module)[0]];
  });
  if (validator) validator(instancesOrClasses);

  return instancesOrClasses;
}

export async function discoverCommands(): Promise<Command[]> {
  return await discover<Command>('**/*.command.js', true, validateCommands);
}
