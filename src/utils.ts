export function formatErrorMessage(err: Error): string {
  let message = err.message.split(' (')[0];
  const regex = /^(\d{3}): ([A-Z_]+).*/;
  const match = message.match(regex);

  if (match) {
    // const errorCode = match[1];
    const errorType = match[2];
    message = errorType
      .split('_')
      .join(' ').toLocaleLowerCase();

    return `Error: ${message}`;
  } else {
    return message;
  }
}

export function isAsync(fn: CallableFunction): boolean {
  return (
    (fn?.constructor?.name === 'AsyncFunction' ||
      Object.prototype.toString.call(fn) === '[object AsyncFunction]') ||
    fn instanceof Promise ||
    (fn !== null &&
      typeof fn === 'object' &&
      typeof (fn as Promise<unknown>).then === 'function' &&
      typeof (fn as Promise<unknown>).catch === 'function')
  );
}

export function addS(str: string): string {
  const word = str.toLowerCase();
  const exceptions = ['s', 'x', 'z', 'ch', 'sh'];

  if (exceptions.some(ex => word.endsWith(ex))) {
    return word + 'es';
  } else if (word.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2])) {
    return word.slice(0, -1) + 'ies';
  } else {
    return word + 's';
  }
}

export function getImageFormat(buffer: Buffer): string | undefined {
  const signatures = {
    jpg: 'ffd8ffe0',
    png: '89504e47',
    gif: '47494638',
    bmp: '424d',
    webp: '52494646',
    tiff: '49492a00',
  };

  const signature = buffer.toString('hex', 0, 8).toLowerCase();
  for (const [format, sig] of Object.entries(signatures)) {
    if (signature.startsWith(sig)) {
      return format;
    }
  }

  // Not recognized
  return undefined;
}

export function* chunkify<T>(inputList: T[], num: number): Generator<T[]> {
  for (let i = 0; i < inputList.length; i += num) {
    yield inputList.slice(i, i + num);
  }
}

export * as Utils from './utils.js';
