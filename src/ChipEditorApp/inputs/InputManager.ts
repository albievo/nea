import events from "../event/events";
import { Camera } from "../rendering/Camera";
import { Vector2 } from "../../utils/Vector2";
import $ from 'jquery';

export class InputManager {
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
}