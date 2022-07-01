class UserState {
  private _state: { [key: string]: unknown } = {};

  public get(key: string): unknown {
    return this._state[key];
  }

  public set(key: string, value: unknown): void {
    this._state[key] = value;
  }

  public delete(key: string): void {
    delete this._state[key];
  }
}

class StateManager {
  private _userStates: { [key: string]: UserState } = {};

  public get(key: string): UserState {
    if (!this._userStates[key]) {
      this._userStates[key] = new UserState();
    }
    return this._userStates[key];
  }

  public set(key: string, state: UserState): void {
    this._userStates[key] = state;
  }

  public delete(key: string): void {
    delete this._userStates[key];
  }
}

export default new StateManager();
