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
    required: [],
    additionalProperties: false,
    properties: {
      _id: {},
    },
  },
};
