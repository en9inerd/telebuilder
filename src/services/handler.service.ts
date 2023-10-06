import { Handler as HandlerModel } from '../models/handler.model.js';
import { collections } from './database.service.js';
import { injectable } from '../decorators/index.js';
import { DeleteResult, InsertOneResult } from 'mongodb';
import { Handler } from '../types.js';

@injectable
export class HandlerService {
  public async addHandler(handler: Handler): Promise<InsertOneResult<HandlerModel>> {
    return collections.handlers.insertOne(
      this.convertToHandlerModel(handler)
    );
  }

  public async removeHandler(name: string, command: string): Promise<DeleteResult> {
    return collections.handlers.deleteOne({
      name,
      command
    });
  }

  public async getHandler(name: string, command: string): Promise<HandlerModel | null> {
    return collections.handlers.findOne({
      name,
      command,
    });
  }

  public async getAllHandlers(): Promise<HandlerModel[]> {
    return collections.handlers.find().toArray();
  }

  private convertToHandlerModel(handler: Handler): HandlerModel {
    handler.event.chats = handler.event.chats?.map(chat => chat.toString());
    handler.event.fromUsers = handler.event.fromUsers?.map(user => user.toString());
    handler.event.blacklistUsers = handler.event.blacklistUsers?.map(user => user.toString());

    return handler as HandlerModel;
  }
}
