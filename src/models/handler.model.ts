import { Schema, model } from 'mongoose';
import { Handler } from '../types';

const schema = new Schema<Handler>(
  {
    name: { type: String, required: true },
    command: { type: String, required: true },
    event: {
      name: { type: String, required: true },
      incoming: { type: Boolean },
      outgoing: { type: Boolean },
      chats: { type: [String] },
      fromUsers: { type: [String] },
      forwards: { type: Boolean },
      pattern: { type: String },
    },
  },
  { timestamps: true },
);

schema.index({ command: 1, name: 1 }, { unique: true });

export const HandlerModel = model<Handler>('Handler', schema);
