import { EventHandlerMap } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { BoundingBox, Renderable, RenderableKind } from "./Renderable";
import { AnyRenderBuffer, RenderPayloadUtils, TempWireRenderBuffer } from "./RenderPayloads";
import { RenderManager } from "./RenderManager";
import { AStarPathfinder } from "./pathfinding/AStarPathfinder";
import { merge } from "jquery";

export class TempWire extends Renderable<'temp-wire'> {
  protected _kind = 'temp-wire' as const; // as const specify typing as 'temp-wire' rather than just a string
  protected renderBuffer: TempWireRenderBuffer = { kind: 'temp-wire' };

  private path: Vector2[];
  private startingPos: Vector2;

  private pathfinder: AStarPathfinder;

  private boundingBox: BoundingBox = { // initialised as 0s
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  } 

  private WIDTH = 0.3; // width in world units

  constructor(id: string, renderManager: RenderManager, startingPos: Vector2) {
    super(id, renderManager);
    
    this.startingPos = startingPos;
    this.path = [startingPos];

    this.pathfinder = new AStarPathfinder(renderManager.availabilityGrid);
  }

  protected getEventHandlers(): EventHandlerMap {
    return {
      ...this.baseEventHandlers,
      'mouse-changed-cell': this.handleMouseChangedCell.bind(this)
    }
  }

  protected updateFromBuffer(): void {
    const newPath = this.renderBuffer.updatedPath;

    if (newPath) {
      this.path = [];

      const firstCell = newPath[0];
      this.path.push(firstCell);

      this.boundingBox.top = firstCell.y;
      this.boundingBox.right = firstCell.x
      this.boundingBox.bottom = firstCell.y;
      this.boundingBox.left = firstCell.x

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
    console.log('rendering temp wire')

    const ctx = this.renderManager.ctx;
    const camera = this.renderManager.camera;
    const widthScreen = camera.worldUnitsToScreenPixels(this.WIDTH);


    for (let cellIdx = 0; cellIdx < this.path.length; cellIdx++) {
      const cell = this.path[cellIdx];

      console.log(cell.x, cell.y)

      const centre = cell.add(new Vector2(0.5, 0.5));
      const centreScreen = camera.worldPosToScreen(centre);

      ctx.beginPath();
      ctx.arc(
        centreScreen.x, centreScreen.y,
        widthScreen,
        0, 2 * Math.PI
      );

      ctx.fillStyle = 'black';
      ctx.fill();
    }
  }

  protected getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  private handleMouseChangedCell(movement: {from: Vector2, to: Vector2}) {
    const newPath = this.pathfinder.pathfind(this.startingPos, movement.to);
    if (!newPath) {
      console.error(`couldn't pathfind from ${this.startingPos} to ${movement.to}`);
      return;
    }

    this.appendRenderBuffer({
      updatedPath: newPath
    });
  }

  protected resetRenderBuffer(): void {
    this.renderBuffer = { kind: 'temp-wire' };
  }

  protected mergeRenderBuffers(
    original: TempWireRenderBuffer,
    toAdd: TempWireRenderBuffer
  ): TempWireRenderBuffer {

    const mergedOriginal = RenderPayloadUtils.mergeGenericProperties(
      original, toAdd
    )

    mergedOriginal.initial = toAdd.initial || original.initial;

    // update to most recent path
    mergedOriginal.updatedPath = toAdd.updatedPath ?? original.updatedPath;

    return mergedOriginal;
  }
}