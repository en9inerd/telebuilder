import config from 'config';
import { Collection, Db, MongoClient, MongoServerError } from 'mongodb';
import { Handler } from '../models/handler.model';
import { discoverModels } from '../discovery';
import { ModelClass } from '../types';

export const collections = {} as {
  handlers: Collection<Handler>
};

export class DBService {
  private readonly connectString: string;
  private readonly builtInModels = <ModelClass[]>[Handler];
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
    await this.applySchemaValidations();

    // Initialize collections
    this.initCollections();
    this.initOwnCollections();
  }

  private initCollections() {
    collections.handlers = this.dbInstance.collection<Handler>(this.builtInModels[0].collectionName);
  }

  // Try applying the modification to the collection, if the collection doesn't exist, create it
  private async applySchemaValidations() {
    const modelClasses = await discoverModels();
    modelClasses.push(...this.builtInModels);

    for (const modelClass of modelClasses) {
      if (!modelClass.jsonSchema) continue;

      await this.dbInstance.command({
        collMod: modelClass.collectionName,
        validator: modelClass.jsonSchema
      }).catch(async (error: MongoServerError) => {
        if (error.codeName === 'NamespaceNotFound') {
          await this.dbInstance.createCollection(modelClass.collectionName, { validator: modelClass.jsonSchema });
        } else {
          throw error;
        }
      });
    }
  }

  protected initOwnCollections() {
    // use this method to initialize your own collections
    // ownCollections.yourCollection = this.dbInstance.collection<YourCollection>((<ModelClass>YourCollection).collectionName);
  }
}
