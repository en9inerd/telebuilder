# TeleBuilder

[![npm version](https://badge.fury.io/js/telebuilder.svg)](https://badge.fury.io/js/telebuilder)

TeleBuilder is a simple Telegram bot framework for building command message-centric Telegram bots in TypeScript/JavaScript. It's built on top of GramJS. This allows you to build bots and userbots with more features and fewer limitations than using frameworks based on Telegram Bot API.

**Note**: TeleBuilder is still in early development and is primarily used for personal bot projects. Please report any bugs or suggest improvements.

## Features

- **Command-Centric Design**: Define and manage bot commands easily with a clear and concise interface.
- **Command Locking**: Prevent a command from running multiple times simultaneously for the same user.
- **Easily Configurable Command Scopes**: Limit command execution to specific users, chats, or peers.
- **Command Config Caching**: Store current command configuration on disk for updates and restarts.
- **Lightweight configuration management**: Load and manage configuration settings for your bot like node-config.

## Installation

```bash
npm install telebuilder
```

## Usage

Example of a bot built with TeleBuilder: [jekyll-post-bot](https://github.com/en9inerd/jekyll-post-bot)

### Configuration

TeleBuilder uses a `ConfigService` to manage and load configuration settings for your bot. The service loads configuration files based on your environment and merges them to create a final, read-only configuration object that your application can use.

#### Setting Up Configuration

The configuration files are located in the `config` directory of your project. By default, the service looks for a `default.js` configuration file, and if an environment variable `NODE_ENV` is set, it will also look for a configuration file named after the environment (e.g., `development.js`, `production.js`).

#### Example Default Configuration

Here is an example of what your default configuration file might look like:

```typescript
// config/default.js
import { readFile } from 'node:fs/promises';

// App version
const version = JSON.parse(await readFile(new URL('../package.json', import.meta.url))).version;

export default {
  botConfig: {
    botDataDir: process.env.TG_BOT_DATA_DIR || './botData',
    apiId: Number.parseInt(process.env.TG_BOT_API_ID),
    apiHash: process.env.TG_BOT_API_HASH,
    token: process.env.TG_BOT_TOKEN,
    appVersion: process.env.TG_BOT_APP_VERSION || version,
  }
};
```

#### Accessing Configuration Values

To access the configuration values in your application, use the `config.get()` method. You can provide a key path as a string to access nested properties. For example:

```typescript
import { config } from 'telebuilder/config';

const apiId = config.get<number>('botConfig.apiId');
const apiHash = config.get<string>('botConfig.apiHash');
const token = config.get<string>('botConfig.token');
```

For more details on setting up and managing configurations, refer to the [configuration file](./config/default.js) in the project repository.

### Creating a Bot

Entry module for your bot application. This is where you define your bot and its commands.
Here’s a basic example of how to create and initialize your bot:

```typescript
#!/usr/bin/env node
import { TelegramBotClient } from 'telebuilder';
import { StartCommand } from './commands/start.command.js';

const client = new TelegramBotClient({
  commands: [
    StartCommand,
  ]
});

await client.init();
```

### Defining Commands

Each command is a class that implements the `Command` interface and is decorated with the `@command` decorator.
There are required properties and methods that you need to implement in your command class:
- `command`: The command name that triggers the command.
- `description`: A brief description of what the command does.
- `scopes`: An array of `CommandScope` objects that define where the command and by whom it can be executed.
- `langCodes`: An array of language codes for which the command is available.
- `entryHandler`: The method that is called when the command is executed.

Here is an example of a command class:

```typescript
@command
export class StartCommand implements Command {
  command = 'start';
  description = 'Start the bot';
  scopes: CommandScope[] = [
    {
      name: 'Peer',
      peer: channelAuthor
    },
  ];
  langCodes = [];

  @handler({
    event: {
      fromUsers: [channelAuthor],
    }
  })
  public async entryHandler(event: NewMessageEvent): Promise<void> {
    if (!event.client || !event?.message?.senderId) return;
  }
}
```

### Event/Update Handlers

Event handlers are methods that are called when a specific event occurs. You can define event handlers for different types of events, such as new messages, edited messages, callback queries and other events supported by GramJS.
To define an event handler, use the `@handler` decorator and provide the event type and any additional options that you want to apply to the handler. `@handler` decorator isn't required for command entry handlers.
Example of an event handler:

```typescript
  @handler({
    type: 'album',
    event: {
      chats: [channelId],
      incoming: true,
      outgoing: false,
    },
    validateCommandParams: false,
    lock: false
  })
  @catchError()
  public async getNewAlbum(event: AlbumEvent): Promise<void> {
    // prevent edited messages from being processed
    if (event.messages.length === 1 || !event?.client) return;

    // process the album;
  }
```

### Command Parameters

Commands can take parameters that are passed by the user when executing the command like `/command param1=value1 param2=value2`.

You can define parameters for your commands using the `@params` decorator. The `@params` decorator takes an object that defines the parameters for the command. Each parameter is defined by a key-value pair where the key is the parameter name and the value is an object that defines the parameter schema. At the moment, the supported parameter types are `string`, `number`, `boolean`, and `enum`.

Here is an example of how to define parameters for a command:

```typescript
  @params params: CommandParamsSchema = {
    param1: {
      type: 'string',
      required: true,
      default: '',
    },
    param2: {
      type: 'number',
      required: false,
      default: 0,
    },
    param3: {
      type: 'enum',
      enamValues: ['value1', 'value2', 'value3'],
      required: false,
    },
  };
```

### Button Menus

### Dependency Injection

### Error Handling

### Access to Client object

## License

## Contributing
