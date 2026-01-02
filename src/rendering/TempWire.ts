import { EventHandlerMap } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { BoundingBox, Renderable, RenderableKind } from "./Renderable";
import { TempWireRenderBuffer } from "./RenderPayloads";
import { RenderManager } from "./RenderManager";
import { AStarPathfinder } from "./pathfinding/AStarPathfinder";

export class TempWire extends Renderable {
  protected _kind: RenderableKind = 'temp-wire';
  protected renderBuffer: TempWireRenderBuffer = { kind: 'temp-wire' };

  private path: Vector2[];
  private startingPos: Vector2;

  private pathfinder: AStarPathfinder;

  private boundingBox: BoundingBox = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  } // initialised as 0s

  private WIDTH = 0.3; // width in world units

  constructor(id: string, renderManager: RenderManager, startingPos: Vector2) {
    super(id, renderManager);
    
    this.startingPos = startingPos;
    this.path = [startingPos];

    this.pathfinder = new AStarPathfinder(renderManager.availabilityGrid);
  }

  protected getEventHandlers(): EventHandlerMap {
    return {
      'mouse-changed-cell': this.handleMouseChangedCell.bind(this)
    }
  }

  protected updateFromBuffer(): void {
    const newPath = this.renderBuffer.updatedPath;

    console.log(`new path: ${newPath}`);

    if (newPath) {
      this.path = [];

      for (let cellIdx = 0; cellIdx < newPath.length; cellIdx++) {
        const cell = newPath[cellIdx];

        // add cell to path
        this.path.push(cell);

        // update bounding box given new cell
        if (cell.x < this.boundingBox.left) {
          this.boundingBox.left = cell.x;
        }
        else if (cell.x > this.boundingBox.right) {
          this.boundingBox.right = cell.x;
        }
        if (cell.y < this.boundingBox.top) {
          this.boundingBox.top = cell.y;
        }
        else if (cell.y > this.boundingBox.bottom) {
          this.boundingBox.bottom = cell.y;
        }
      }
    }
  }
  
  protected renderObject(): void {
    console.log('rendering path');

    const ctx = this.renderManager.ctx;
    const camera = this.renderManager.camera;

    for (let cellIdx = 0; cellIdx < this.path.length; cellIdx++) {
      const cell = this.path[cellIdx]

      const centre = cell.add(new Vector2(0.5, 0.5));
      const centreScreen = camera.worldPosToScreen(centre);

      ctx.beginPath();
      ctx.arc(
        centreScreen.x, centreScreen.y,
        this.WIDTH,
        0, 2 * Math.PI
      );

      ctx.fillStyle = 'black';
      ctx.fill();
    }
  }

  protected getBoundingBox(): BoundingBox {
    console.log('getting bounding box');
    console.log(this.boundingBox);

    return this.boundingBox;
  }

  private handleMouseChangedCell(movement: {from: Vector2, to: Vector2}) {
    const newPath = this.pathfinder.pathfind(this.startingPos, movement.to);
    if (!newPath) {
      console.error(`couldn't pathfind from ${this.startingPos} to ${movement.to}`);
      return;
    }
    
    this.renderManager.requestRender({
      updatedTempWirePath: newPath
    });
  }
}