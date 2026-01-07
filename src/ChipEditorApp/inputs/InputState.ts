import events from "../event/events";

class InputState {
  private _space: boolean = false;

  constructor() {
    events.on('space-down', () => this.space = true);
    events.on('space-up', () => this.space = false);
  }

  private set space(space: boolean) { this._space = space };
  public get space() { return this._space };
}

const inputState = new InputState();
export default inputState;