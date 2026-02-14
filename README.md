# TeleBuilder

> **Note**: This repository has been archived. The underlying [GramJS](https://github.com/gram-js/gramjs) library is no longer actively maintained, so this project won't receive further updates. If you're looking for a replacement, check out [TeleKit](https://github.com/en9inerd/telekit) — a similar project written in Go.

[![npm version](https://badge.fury.io/js/telebuilder.svg)](https://badge.fury.io/js/telebuilder)

TeleBuilder is a simple Telegram bot framework for building command message-centric Telegram bots in TypeScript/JavaScript. It's built on top of GramJS, allowing you to create bots and userbots with more features and fewer limitations than using frameworks based on Telegram Bot API.

**Note**: TeleBuilder is still in early development and is primarily used for personal bot projects. Please report any bugs or suggest improvements.

## Features

- **Command-Centric Design**: Define and manage bot commands easily with a clear and concise interface.
- **Command Locking**: Prevent a command from running while another command is in progress.
- **Easily Configurable Command Scopes**: Limit command execution to specific users, chats, or peers.
- **Command Config Caching**: Store current command configuration on disk for updates and restarts.
- **Lightweight configuration management**: Load and manage configuration settings for your bot like node-config.

## Installation

```bash
npm install telebuilder
```

## Usage

Example of a bot built with TeleBuilder: [zola-post-bot](https://github.com/en9inerd/zola-post-bot)

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

TeleBuilder allows you to define interactive button menus using the @buttonsReg decorator.

#### Defining Button Menus

To create button menus within a command class:

1. **Define Button Fields**: Add class fields representing button layouts using `Buttons` type. Each button is typically created with `Button.inline`, specifying the display text and callback data.
2. **Apply the `@buttonsReg` Decorator**: Decorate these fields with `@buttonsReg`. This decorator performs validation and preprocessing to ensure that each button's callback data is correctly linked to a handler method within the class.

#### How `@buttonsReg` Works

The `@buttonsReg` decorator performs the following actions:

- **Validation**: It checks that each button's callback data corresponds to an existing callback query handler method in the class. If a matching handler is not found, it throws a `DecoratorException`.
- **Data Prefixing**: It prefixes the callback data of each button with the class name followed by a colon (`:`). This namespacing helps avoid conflicts between handlers in different classes.
- **Handler Linking**: Ensures that the prefixed callback data matches the handler methods, facilitating correct event routing.

#### Implementing Button Menus in a command class

Here’s a brief example:

```typescript
@command
export class SessionCommand implements Command {
  @buttonsReg woSessionButtons: Buttons = [
    [Button.inline('Create session', Buffer.from('createSession'))]
  ];

  @handler({ type: HandlerTypes.CallbackQuery })
  public async createSession(event: CallbackQueryEvent) {
    // Handler implementation...
  }
}
```

Full example of a command class with button: [session.command.ts](https://raw.githubusercontent.com/en9inerd/gromozeka-bot/master/src/commands/session.command.ts)

#### Key Points to Remember

- **Callback Data Consistency**: The callback data specified in `Button.inline` (e.g., `'createSession'`) must exactly match the corresponding handler method name (`createSession`) in the class. The `@buttonsReg` decorator prefixes the callback data with the class name, so ensure handler methods are correctly named without the prefix.
- **Decorator Responsibilities**: The `@buttonsReg` decorator ensures that:
  - Every button has a corresponding handler method.
  - Callback data is appropriately namespaced to prevent conflicts.
  - Any mismatch between buttons and handlers results in a clear exception, aiding in debugging.
- **Error Handling**: If a button's callback data does not match any handler method within the class, a `DecoratorException` is thrown, indicating the specific issue for easy resolution.

### Dependency Injection

TeleBuilder provides a straightforward way to manage dependencies through the use of the `@injectable` and `@inject` decorators. This system ensures that services are automatically registered and resolved within the framework’s internal container.

- `@injectable`: Marks a class as a service that can be injected.
- `@inject`: Injects the dependency into a class where it is needed.

Here’s an example of how to set this up:

```typescript
@injectable
export class MyService {
  public doSomething(): void {
    console.log('Service is doing something.');
  }
}

export class MyComponent {
  @inject(MyService)
  private readonly myService!: MyService;

  public performAction(): void {
    this.myService.doSomething();
  }
}
```

### Error Handling

TeleBuilder includes a `@catchError` decorator to help manage errors in your event handlers gracefully. By using this decorator, you can define a custom error handler that will be invoked if an error occurs during the execution of the handler.

Example of error handling in a command handler:

```typescript
@catchError(async (error) => {
  // Custom error handling logic...
  console.error('Custom Error:', error.message);
})
public async myMethod() {
  // Method logic that might throw an error...
}
```

### Access to Client object

You can access the underlying `TelegramClient` instance provided by GramJS using the `@client` decorator or the `getClient()` function from `telebuilder/states`.

This is useful when you need to perform operations that require direct access to the Telegram client, such as sending messages, handling events, and interacting with the Telegram API.

```typescript
@client
private readonly client!: TelegramClient;

//or

import { getClient } from 'telebuilder/states';

const client = getClient();
```

## License

TeleBuilder is licensed under the MIT License. See [LICENSE](./LICENSE) for more information.

## Contributing

If you have any suggestions or improvements, feel free to open an issue or submit a pull request.
