import { model } from '../decorators/model.decorator.js';

const jsonSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'command', 'event'],
    additionalProperties: false,
    properties: {
      _id: {},
      name: {
        bsonType: 'string',
        description: 'must be a string and is required',
      },
      command: {
        bsonType: 'string',
        description: 'must be a string and is required',
      },
      event: {
        bsonType: 'object',
        required: ['name'],
        additionalProperties: false,
        properties: {
          name: {
            bsonType: 'string',
          },
          incoming: {
            bsonType: 'bool',
          },
          outgoing: {
            bsonType: 'bool',
          },
          chats: {
            bsonType: 'array',
            items: {
              bsonType: 'string',
            },
          },
          fromUsers: {
            bsonType: 'array',
            items: {
              bsonType: 'string',
            },
          },
          forwards: {
            bsonType: 'bool',
          }
        }
      }
    },
  },
};

@model({
  collectionName: 'handlers',
  jsonSchema
})
export class Handler {
  name!: string;
  command!: string;
  event!: {
    name: string;
    incoming?: boolean;
    outgoing?: boolean;
    chats?: string;
    fromUsers?: string[];
    forwards?: boolean;
    pattern?: string;
  };
}
