export class DecoratorException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DecoratorException';
  }
}

export class TelegramClientException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'TelegramClientException';
  }
}

export class StateException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StateException';
  }
}

export class CommandException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'CommandException';
  }
}

export class HelperException extends CommandException {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'HelperException';
  }
}

export class ConfigException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ConfigException';
  }
}
