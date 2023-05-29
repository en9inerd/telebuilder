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

export const HandlerJSONSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'price', 'category'],
    additionalProperties: false,
    properties: {
      _id: {},
      name: {
        bsonType: 'string',
        description: "'name' is required and is a string",
      },
      price: {
        bsonType: 'number',
        description: "'price' is required and is a number",
      },
      category: {
        bsonType: 'string',
        description: "'category' is required and is a string",
      },
    },
  },
};
