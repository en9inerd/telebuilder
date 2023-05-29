import { TelegramClient } from 'telegram';
import { Handler } from '../models/handler.model';
import { collections } from './database.service';

export class HandlerService {
  constructor(private readonly client: TelegramClient) { }

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
