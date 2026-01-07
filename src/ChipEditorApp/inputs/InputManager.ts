import events from "../event/events";
import { Camera } from "../rendering/Camera";
import { Vector2 } from "../../utils/Vector2";
import $ from 'jquery';

export class InputManager {
  private _space: boolean = false;
  
  constructor(
    private camera: Camera
  ) {
    this.setListeners();
  }

  private setListeners() {
    $(document).on('mousedown', e => this.handleMouseDown(e))
    $(document).on('mouseup', e => this.handleMouseUp(e))
    $(document).on('mousemove', e => this.handleMouseMove(e));
    $(document).on('wheel', e => this.handleWheel(e));
    $(document).on('keydown.spaceKeyTracker', e => {
      if (e.key === ' ') this.handleSpaceKeyDown();
    });
  }

  private handleMouseDown(event: JQuery.MouseDownEvent) {
    const worldPos = this.camera.getWorldPosFromJqueryMouseEvent(event);
    events.emit('mouse-down', { worldPos });
  }

  private handleMouseUp(event: JQuery.MouseUpEvent) {
    const worldPos = this.camera.getWorldPosFromJqueryMouseEvent(event);
    events.emit('mouse-up', { worldPos });
  }

  private handleMouseMove(event: JQuery.MouseMoveEvent) {
    const worldPos = this.camera.getWorldPosFromJqueryMouseEvent(event);
    events.emit('mouse-move', { worldPos });
  }

  private handleWheel(event: JQuery.TriggeredEvent) {
    const DOMEvent = event.originalEvent as WheelEvent;
    const worldPos = this.camera.getWorldPosFromDOMWheelEvent(DOMEvent);

    events.emit('wheel', {
      worldPos,
      delta: new Vector2(DOMEvent.deltaX, DOMEvent.deltaY)
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