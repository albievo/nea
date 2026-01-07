import events from "../event/events";
import $ from 'jquery';

class KeyTracker {
  private _space: boolean = false;

  constructor() {
    // track whether space is held down
    $(document).on('keydown.spaceKeyTracker', e => {
      if (e.key === ' ') this.handleSpaceKeyDown();
    });
  }

  private handleSpaceKeyDown() {
    this.space = true;
    $(document).off('keydown.spaceKeyTracker');
    $(document).on('keyup.spaceKeyTracker', e => {
      if (e.key === ' ') {
        this.handleSpaceKeyUp();
      }
    });

    events.emit('space-down');
  }

  private handleSpaceKeyUp() {
    this.space = false;
    $(document).off('keyup.spaceKeyTracker');
    $(document).on('keydown.spaceKeyTracker', e => {
      if (e.key === ' ') {
        this.handleSpaceKeyDown();
      }
    });

    events.emit('space-up');
  }

  private set space(val: boolean) {
    this._space = val;
  }

  public get space() {
    return this._space;
  }
}

const keyTracker = new KeyTracker();

export default keyTracker;