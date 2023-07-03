import { Handler } from '../models/handler.model';
import { collections } from './database.service';
import { injectable } from '../decorators';

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
