import config from 'config';
import { LocalStorage } from 'node-localstorage';
import store, { StoreAPI } from 'store2';

function getStore(dirPath: string): StoreAPI {
  return typeof localStorage === 'undefined' || localStorage === null
    ? store.area('fs', new LocalStorage(dirPath))
    : store.area('fs', localStorage);
}

export const Store = getStore(config.get('botConfig.botDirInfo'));
