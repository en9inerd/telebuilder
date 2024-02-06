import readline from 'readline';
import { HelperException } from '../exceptions.js';

class InputHelper {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  public async text(question: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.rl.question(question, (answer: string) => {
        resolve(answer);
      });
      this.rl.on('close', () => {
        reject(new HelperException('Input closed unexpectedly'));
      });
    });
  }

  public async password(question: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stdin = process.openStdin();
      let password = '';

      const onKeyPress = (char: string) => {
        char = char.toString().trim();
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            cleanUp();
            resolve(password);
            break;
          default:
            process.stdout.write('\u001B[2K\u001B[200D' + question + Array(password.length + 1).join('*'));
            password += char;
            break;
        }
      };

      const cleanUp = () => {
        stdin.removeListener('data', onKeyPress);
        process.stdin.removeListener('keypress', onKeyPress);
        stdin.pause();
        this.rl.removeListener('close', onClose);
      };

      const onClose = () => {
        cleanUp();
        reject(new HelperException('Input closed unexpectedly'));
      };

      stdin.on('data', onKeyPress);
      process.stdin.on('keypress', onKeyPress);
      this.rl.on('close', onClose);
    });
  }

  public close(): void {
    this.rl.close();
  }
}

export const input = new InputHelper();
