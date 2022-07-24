import { Dictionary } from '../types';

export class BaseState {
  private _state: Record<string, Dictionary> = {};

  public get(stateId: string, key: string): unknown {
    return this._state[stateId]?.[key];
  }

  public set(stateId: string, key: string, value: unknown): void {
    this._state[stateId] = {
      ...this._state[stateId],
      [key]: value
    };
  }

  public has(stateId: string, key: string): boolean {
    return this._state[stateId]?.[key] !== undefined;
  }

  public deleteStateProperty(stateId: string, key: string): void {
    if (this._state[stateId]?.[key]) {
      delete this._state[stateId][key];
    }
  }

  public clearState(stateId: string): void {
    this._state[stateId] = {};
  }

  public clearAll(): void {
    this._state = {};
  }
}
