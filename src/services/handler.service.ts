import { TelegramClient } from 'telegram';
import { HandlerModel } from '../models';
import { Handler } from '../types';

export class HandlerService {
  constructor(private readonly client: TelegramClient) { }

  public async addHandler(handler: Handler): Promise<void> {
    HandlerModel.create(handler);
    return;
  }

  public async removeHandler(handler: Handler): Promise<void> {
    HandlerModel.deleteOne({
      name: handler.name,
    });
    return;
  }

  public async getAllHandlers(): Promise<void> {
    //
  }
}
