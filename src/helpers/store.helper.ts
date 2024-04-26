import { LocalStorage } from 'node-localstorage';
import store, { type StoreAPI } from 'store2';
import { config } from '../config.js';

function getStore(dirPath: string): StoreAPI {
  return typeof localStorage === 'undefined' || localStorage === null
    ? (<StoreAPI><unknown>store).area('fs', new LocalStorage(dirPath))
    : (<StoreAPI><unknown>store).area('fs', localStorage);
}

export const Store = getStore(config.get('botConfig.botDataDir'));
