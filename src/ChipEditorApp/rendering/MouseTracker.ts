import events from "../event/events";
import $ from 'jquery';
import { RenderManager } from "./RenderManager";
import { Vector2 } from "../../utils/Vector2";

export class MouseTracker {
  private renderManager: RenderManager;
  private worldSize: Vector2;

  private _mouseCell: Vector2 = Vector2.zeroes;

  constructor(renderManager: RenderManager, worldSize: Vector2) {
    this.renderManager = renderManager;
    this.worldSize = worldSize;
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