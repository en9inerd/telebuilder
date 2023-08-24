import { BaseState } from './base.state.js';
import { container } from './container.js';

export const userState = new BaseState();
export const chatState = new BaseState();

export function getClient() {
  return container.client;
}
