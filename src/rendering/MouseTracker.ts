import events from "../event/events";
import keyTracker from "./KeyTracker";
import $ from 'jquery';
import { RenderManager } from "./RenderManager";
import { Vector2 } from "../utils/Vector2";

export class MouseTracker {
  private renderManager: RenderManager;
  private worldSize: Vector2;

  private _isOnElement: boolean = false;

  constructor(renderManager: RenderManager, worldSize: Vector2) {
    this.renderManager = renderManager;
    this.worldSize = worldSize;

    $(document).on('mousemove', e => this.handleMouseMove(e));
  }

  private handleMouseMove(event: JQuery.MouseMoveEvent) {
    const camera = this.renderManager.camera;
    const availabilityGrid = this.renderManager.availabilityGrid;

    const worldPos = camera.getWorldPosFromJqueryMouseEvent(event);
    const cell = worldPos.applyFunction(Math.floor);
    if ( // if out of bounds
      cell.x < 0 ||
      cell.y < 0 ||
      cell.x >= this.worldSize.x ||
      cell.y >= this.worldSize.y
    ) {
      return;
    }
    const takenBy = availabilityGrid[cell.y][cell.x];

    // if we are on an element and we havent yet said that we are
    if (!this.isOnElement && takenBy.type === 'element') {
      this.isOnElement = true;
      events.emit('mouse-moved-into-element');
      console.log('mouse moved onto element');
    }
    // if we arent on an element and havent yet said that we arents
    else if (this.isOnElement && !(takenBy.type === 'element')) {
      this.isOnElement = false;
      events.emit('mouse-moved-off-element');
      console.log('mouse moved off element');
    }
  }

  public get isOnElement() {
    return this._isOnElement;
  }

  private set isOnElement(val: boolean) {
    this._isOnElement = val;
  }
}