import { BaseState } from './base.state';
import { container } from './container';

export const userState = new BaseState();
export const chatState = new BaseState();

export function getClient() {
  return container.client;
}
