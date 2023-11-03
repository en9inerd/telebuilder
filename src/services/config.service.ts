import { access } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { ConfigException } from '../exceptions.js';
import { configInstance } from '../keys.js';

export class ConfigService {
  private rootAppDir = '';
  private defaultConfigPath = '';
  private envConfigPath = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private config: any = {};
  private isConfigLoaded = false;
  private static [configInstance]: ConfigService;

  public static get instance(): Promise<ConfigService> {
    return (async () => {
      if (!this[configInstance]) {
        this[configInstance] = new ConfigService();
        await this[configInstance].init();
      }
      return this[configInstance];
    }
    )();
  }

  async init() {
    if (!this.isConfigLoaded) {
      this.rootAppDir = await this.getRootAppDir();
      this.defaultConfigPath = join(this.rootAppDir, 'config', 'default.js');
      this.envConfigPath = join(this.rootAppDir, 'config', `${process.env.NODE_ENV || 'default'}.js`);

      const defaultConfig = await this.loadConfigFile(this.defaultConfigPath);
      const envConfig = await this.loadConfigFile(this.envConfigPath);

      this.config = { ...defaultConfig, ...envConfig };
      Object.freeze(this.config); // Make the config read-only
      this.isConfigLoaded = true;
    }
  }

  private async getRootAppDir(): Promise<string> {
    const appDir = process.env.PWD;
    if (appDir) {
      return appDir;
    }

    let dir = fileURLToPath(import.meta.url);
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

    throw new ConfigException('Cannot find root app directory');
  }

  private async loadConfigFile(filePath: string) {
    try {
      const module = await import(filePath);
      return module.default || module;
    } catch (error) {
      throw new ConfigException(`Failed to load config file: ${(<Error>error).message}`);
    }
  }

  get<T>(key: string = ''): T {
    if (!key) {
      return this.config;
    }

    const keys = key.split('.');
    let config = this.config;

    for (const k of keys) {
      if (!Object.prototype.hasOwnProperty.call(config, k)) {
        throw new ConfigException(`Config key "${key}" not found`);
      }
      config = config[k];
    }

    return config;
  }
}
