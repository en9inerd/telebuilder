import { read } from 'read';
import { HelperException } from '../exceptions.js';

class InputHelper {
  public async text(question: string): Promise<string> {
    try {
      return await read({ prompt: question });
    } catch (error) {
      throw new HelperException(`Error reading text: ${(<Error>error).message}`);
    }
  }

  public async password(question: string): Promise<string> {
    try {
      return await read({ prompt: question, silent: true });
    } catch (error) {
      throw new HelperException(`Error reading password: ${(<Error>error).message}`);
    }
  }
}

export const input = new InputHelper();
