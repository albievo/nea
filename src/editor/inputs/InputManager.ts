import events from "../event/events";
import { Camera } from "../rendering/Camera";
import { Vector2 } from "../../utils/Vector2";
import $ from 'jquery';

export class InputManager {
  private _space: boolean = false;
  
  constructor(
    private camera: Camera,
    private $canvas: JQuery<HTMLElement> 
  ) {
    this.setListeners();
  }

  private setListeners() {
    this.$canvas.on('mousedown', e => this.handleMouseDown(e))
    this.$canvas.on('mouseup', e => this.handleMouseUp(e))
    this.$canvas.on('mousemove', e => this.handleMouseMove(e));
    this.$canvas.on('wheel', e => this.handleWheel(e));
    $(document).on('keydown.spaceKeyTracker', e => {
      if (e.key === ' ') this.handleSpaceKeyDown();
    });
    $(document).on('keydown.undoTracker', (e: JQuery.KeyDownEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey; // meta for macOS Cmd
      const isZ = e.key === 'z' || e.key === 'Z';

      if (isCtrl && isZ) this.handleCtrlZ(e);
    });
    $(document).on('keydown.redoTracker', (e: JQuery.KeyDownEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey; // meta for macOS Cmd
      const isZ = e.key === 'y' || e.key === 'Y';

      if (isCtrl && isZ) this.handleCtrlY(e);
    });
    $(window).on('resize', () => {
      events.emit('resize');
    });

    $('#labels-layer').on('focusout', '.label-input', e => {
      this.handleLabelInputSubmit(e);
    })
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

  private handleCtrlZ(e: JQuery.KeyDownEvent) {
    e.preventDefault();     // stop browser undo
    e.stopPropagation();
    events.emit('ctrl-z');
  }

  private handleCtrlY(e: JQuery.KeyDownEvent) {
    e.preventDefault();     // stop browser undo
    e.stopPropagation();
    events.emit('ctrl-y');
  }

  private handleLabelInputSubmit(e: JQuery.FocusOutEvent) {
    const input = e.target as HTMLInputElement;

    events.emit('label-input-submit', {
      text: input.value,
      labeledElem: input.getAttribute('data-labels') ?? ''
    });
  }

  private set space(val: boolean) {
    this._space = val;
  }
  public get space() {
    return this._space;
  }
}