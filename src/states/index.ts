import { StateType } from '../types';
import { BaseState } from './base.state';

class StateManager {
  private _states: Record<StateType, BaseState> = {
    user: new BaseState(),
    chat: new BaseState()
  };

  public get(stateType: StateType): BaseState {
    if (!(stateType in this._states)) {
      throw new Error(`Invalid state type: ${stateType}`);
    }
    return this._states[stateType];
  }

  public clearAll(): void {
    this._states = <Record<StateType, BaseState>>{};
  }
}

export default new StateManager();
