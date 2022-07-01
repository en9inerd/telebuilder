/* eslint-disable @typescript-eslint/no-explicit-any */
import config from 'config';
import { LocalStorage } from 'node-localstorage';
import store, { StoreAPI } from 'store2';

function getStore(dirPath: string): StoreAPI {
  return typeof localStorage === 'undefined' || localStorage === null
    ? (<any>store).area('fs', new LocalStorage(dirPath))
    : (<any>store).area('fs', localStorage);
}

export const Store = getStore(config.get('botConfig.botDirInfo'));
