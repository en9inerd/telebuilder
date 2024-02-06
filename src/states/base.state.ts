import { Dict } from '../types.js';

export class BaseState {
  private _state: Map<string, Dict> = new Map();

  public get<T>(stateId: string, key: string): T | undefined {
    return <T>(this._state.get(stateId)?.[key]);
  }

  public set(stateId: string, key: string, value: unknown): void {
    this._state.set(stateId, {
      ...this._state.get(stateId),
      [key]: value
    });
  }

  public has(stateId: string, key: string): boolean {
    return this._state.get(stateId)?.[key] !== undefined;
  }

  public deleteStateProperty(stateId: string, key: string): void {
    const state = this._state.get(stateId);
    if (state?.[key]) {
      delete state[key];
      this._state.set(stateId, state);
    }
  }

  public clearState(stateId: string): void {
    this._state.set(stateId, {});
  }

  public clearAll(): void {
    this._state = new Map();
  }
}
