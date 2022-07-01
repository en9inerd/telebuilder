module.exports = {
    dbConfig: {
        host: process.env.MONGO_DB_HOST || 'localhost',
        name: process.env.MONGO_INITDB_DATABASE,
        port: process.env.MONGO_DB_PORT || 27017,
        user: process.env.MONGO_DB_USERNAME,
        password: process.env.MONGO_DB_PASSWORD,
        maxPoolSize: process.env.MONGO_DB_MAX_POOL_SIZE || 10
    },
    botConfig: {
        botDirInfo: process.env.TG_BOT_DIR_INFO || './botInfo',
        apiId: parseInt(process.env.TG_BOT_API_ID),
        apiHash: process.env.TG_BOT_API_HASH,
        token: process.env.TG_BOT_TOKEN,
        deviceModel: process.env.TG_BOT_DEVICE_MODEL || 'BotServer',
        appVersion: process.env.TG_BOT_APP_VERSION || '0.1',
        systemVersion: process.env.TG_BOT_SYSTEM_VERSION || '1.0',
        langCode: process.env.TG_BOT_LANG_CODE || 'en',
        systemLangCode: process.env.TG_BOT_SYSTEM_LANG_CODE || 'en',
        connectionRetries: parseInt(process.env.TG_BOT_CONNECTION_RETRIES) || 5,
    }
};
