import { Handler } from '../models/handler.model.js';
import { collections } from './database.service.js';
import { injectable } from '../decorators/index.js';

@injectable
export class HandlerService {
  public async addHandler(handler: Handler): Promise<void> {
    collections.handlers.insertOne(handler);
    return;
  }

  public async removeHandler(handler: Handler): Promise<void> {
    collections.handlers.deleteOne({
      name: handler.name,
    });
    return;
  }

  public async getAllHandlers(): Promise<void> {
    //
  }
}
