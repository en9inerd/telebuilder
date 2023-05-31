import config from 'config';
import { Collection, Db, MongoClient, MongoServerError } from 'mongodb';
import { Handler, HandlerJSONSchema } from '../models/handler.model';

export const collections = {} as {
  handlers: Collection<Handler>
};

export class DBService {
  private readonly connectString: string;
  public dbInstance!: Db;

  constructor() {
    const host = config.get('dbConfig.host'),
      port = config.get('dbConfig.port'),
      name = config.get('dbConfig.name'),
      user = config.get('dbConfig.user'),
      password = config.get('dbConfig.password'),
      maxPoolSize = config.get('dbConfig.maxPoolSize');

    this.connectString = `mongodb://${user}:${password}@${host}:${port}/${name}?maxPoolSize=${maxPoolSize}&authSource=${name}`;
  }

  public async init() {
    // Connect to the database
    const client = new MongoClient(this.connectString);
    await client.connect();

    // Initialize the database instance
    this.dbInstance = client.db();

    // Apply schema validation
    await this.applySchemaValidation();
    await this.applyOwnSchemaValidation();

    // Initialize collections
    this.initCollections();
    this.initOwnCollections();
  }

  private initCollections() {
    collections.handlers = this.dbInstance.collection<Handler>(config.get('dbConfig.collections.handlers'));
  }

  // Try applying the modification to the collection, if the collection doesn't exist, create it
  private async applySchemaValidation() {
    await this.dbInstance.command({
      collMod: config.get('dbConfig.collections.handlers'),
      validator: HandlerJSONSchema
    }).catch(async (error: MongoServerError) => {
      if (error.codeName === 'NamespaceNotFound') {
        await this.dbInstance.createCollection(config.get('dbConfig.collections.handlers'), { validator: HandlerJSONSchema });
      }
    });
  }

  protected initOwnCollections() {
    // use this method to initialize your own collections
    // ownCollections.yourCollection = this.dbInstance.collection<YourCollection>(config.get('dbConfig.collections.yourCollection'));
  }

  protected async applyOwnSchemaValidation() {
    // use this method to apply schema validation to your own collections
  }
}
