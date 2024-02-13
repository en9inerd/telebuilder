// example of config file
import { readFile } from 'fs/promises';

// App version
const version = JSON.parse(await readFile(new URL('../package.json', import.meta.url))).version;

export default {
    botConfig: {
        botDataDir: process.env.TG_BOT_DIR_INFO || './botData',
        apiId: parseInt(process.env.TG_BOT_API_ID),
        apiHash: process.env.TG_BOT_API_HASH,
        token: process.env.TG_BOT_TOKEN,
        appVersion: process.env.TG_BOT_APP_VERSION || version,
        // systemVersion: process.env.TG_BOT_SYSTEM_VERSION || '',
        // connectionLangCode: process.env.TG_BOT_CONNECTION_LANG_CODE || 'en',
        // systemLangCode: process.env.TG_BOT_SYSTEM_LANG_CODE || 'en',
        // connectionRetries: parseInt(process.env.TG_BOT_CONNECTION_RETRIES) || Infinity,
        // useWSS: process.env.TG_BOT_USE_WSS?.toLowerCase() === 'true',
        // testServers: process.env.TG_BOT_TEST_SERVERS?.toLowerCase() === 'true',

        // dcId: parseInt(process.env.TG_BOT_DC_ID) || null,
        // serverAddress: process.env.TG_BOT_SERVER_ADDRESS || '',
        // serverPort: parseInt(process.env.TG_BOT_SERVER_PORT) || null,

        // Bot info
        // profilePhotoUrl: process.env.TG_BOT_PROFILE_PHOTO_URL || null,
        // name: process.env.TG_BOT_NAME || 'TeleBuilder Bot',
        // about: process.env.TG_BOT_ABOUT || 'TeleBuilder Bot about',
        // description: process.env.TG_BOT_DESCRIPTION || 'TeleBuilder Bot description',
        // botInfoLangCode: process.env.TG_BOT_INFO_LANG_CODE || '',
    }
};
