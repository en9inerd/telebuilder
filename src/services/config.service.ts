import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { ConfigException } from '../exceptions.js';
import { configInstance } from '../keys.js';

export class ConfigService {
  private rootAppDir = '';
  // biome-ignore lint/suspicious/noExplicitAny: really any type
  private config: any = {};
  private isConfigLoaded = false;
  private static [configInstance]: ConfigService;

  public static get instance(): Promise<ConfigService> {
    return (async () => {
      if (!ConfigService[configInstance]) {
        ConfigService[configInstance] = new ConfigService();
        await ConfigService[configInstance].init();
      }
      return ConfigService[configInstance];
    }
    )();
  }

  async init() {
    if (this.isConfigLoaded) {
      return;
    }

    this.rootAppDir = await this.getRootAppDir();
    const defaultConfigPath = join(this.rootAppDir, 'config', 'default.js');
    await this.checkConfigFileExists(defaultConfigPath, 'Default');

    let envConfigPath = '';
    if (process.env.NODE_ENV) {
      envConfigPath = join(this.rootAppDir, 'config', `${process.env.NODE_ENV}.js`);
      await this.checkConfigFileExists(envConfigPath, 'Environment', false);
    }

    const defaultConfig = await this.loadConfigFile(defaultConfigPath);
    const envConfig = envConfigPath ? await this.loadConfigFile(envConfigPath) : {};

    this.config = this.mergeConfigs(defaultConfig, envConfig);
    Object.freeze(this.config); // Make the config read-only
    this.isConfigLoaded = true;
  }

  private async checkConfigFileExists(filePath: string, configType: string, throwError = true) {
    try {
      await access(filePath);
    } catch (error) {
      if (throwError) {
        throw new ConfigException(`${configType} config file not found: ${filePath}`);
      }
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: really any type
  private mergeConfigs(defaultConfig: any, overrideConfig: any) {
    const mergedConfig = { ...defaultConfig };

    // Loop through the keys in overrideConfig
    for (const key in overrideConfig) {
      if (typeof overrideConfig[key] === 'object' && key in defaultConfig) {
        // Recursively merge nested objects
        mergedConfig[key] = this.mergeConfigs(defaultConfig[key], overrideConfig[key]);
      } else {
        // Overwrite the property in the defaultConfig
        mergedConfig[key] = overrideConfig[key];
      }
    }

    return mergedConfig;
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

  get<T>(key = '', defaultValue?: T): T {
    if (!key) {
      return this.config;
    }

    const keys = key.split('.');
    let config = this.config;

    for (const k of keys) {
      if (!Object.prototype.hasOwnProperty.call(config, k)) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new ConfigException(`Config key "${key}" not found`);
      } else {
        if (config[k] === null || config[k] === undefined) {
          if (defaultValue !== undefined) {
            return defaultValue;
          }
        }
      }
      config = config[k];
    }

    return config;
  }
}
