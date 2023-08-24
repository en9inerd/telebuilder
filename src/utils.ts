export function formatErrorMessage(err: Error): string {
  return 'Error: ' + err.message.split(' (')[0];
}

export function isAsync(fn: CallableFunction): boolean {
  return (
    fn?.constructor?.name === 'AsyncFunction' ||
    Object.prototype.toString.call(fn) === '[object AsyncFunction]' ||
    fn instanceof Promise ||
    (fn !== null && typeof fn === 'object' && typeof (<Promise<unknown>>fn).then === 'function' && typeof (<Promise<unknown>>fn).catch === 'function')
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

export function* chunkify<T>(inputList: T[], num: number): Generator<T[]> {
  for (let i = 0; i < inputList.length; i += num) {
    yield inputList.slice(i, i + num);
  }
}

export * as Utils from './utils.js';
