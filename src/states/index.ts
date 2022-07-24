import { BaseState } from './base.state';

class StateManager {
  private _states: Record<string, BaseState> = {
    user: new BaseState(),
    chat: new BaseState()
  };

  public get(stateType: string): BaseState {
    if (!this._states[stateType]) {
      throw new Error(`Invalid state type: ${stateType}`);
    }
    return this._states[stateType];
  }

  public clearAll(): void {
    this._states = {};
  }
}

export default new StateManager();
