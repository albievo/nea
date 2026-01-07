import events from "../event/events";
import keyTracker from "./KeyTracker";
import $ from 'jquery';
import { RenderManager } from "./RenderManager";
import { Vector2 } from "../../utils/Vector2";

export class MouseTracker {
  private renderManager: RenderManager;
  private worldSize: Vector2;

  private _mouseCell: Vector2 = Vector2.zeroes;
  private _isOnElement: boolean = false;

  constructor(renderManager: RenderManager, worldSize: Vector2) {
    this.renderManager = renderManager;
    this.worldSize = worldSize;

    events.on('mouse-move', e => this.handleMouseMove(e));
  }

  private handleMouseMove(event: { worldPos: Vector2 }) {
    const camera = this.renderManager.camera;
    const availabilityGrid = this.renderManager.availabilityGrid;

    const worldPos = event.worldPos;
    const cell = worldPos.applyFunction(Math.floor);
    if ( // if out of bounds
      cell.x < 0 ||
      cell.y < 0 ||
      cell.x >= this.worldSize.x ||
      cell.y >= this.worldSize.y
    ) {
      return;
    }

    if (!cell.equals(this.mouseCell)) {
      const from = this.mouseCell
      this.mouseCell = cell;
      events.emit('mouse-changed-cell', {
        from, 
        to: cell
      })
    }
    
    const takenBy = availabilityGrid[cell.y][cell.x];
    // if we are on an element and we havent yet said that we are
    if (!this.isOnElement && takenBy.type === 'element') {
      this.isOnElement = true;

      const elementId = availabilityGrid[cell.y][cell.x].ids[0]
      events.emit('mouse-moved-into-element', { elementId });
    }
    // if we arent on an element and havent yet said that we arents
    else if (this.isOnElement && !(takenBy.type === 'element')) {
      this.isOnElement = false;
      events.emit('mouse-moved-off-element');
    }
  }

  public get isOnElement() {
    return this._isOnElement;
  }
  private set isOnElement(val: boolean) {
    this._isOnElement = val;
  }

  public get mouseCell() {
    return this._mouseCell
  }
  private set mouseCell(cell: Vector2) {
    this._mouseCell = new Vector2(
      Math.max(0, Math.min(this.worldSize.x, cell.x)),
      Math.max(0, Math.min(this.worldSize.y, cell.y))
    )
  }
}