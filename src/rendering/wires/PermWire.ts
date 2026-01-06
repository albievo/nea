import { GridElement } from "../GridElement";
import { PermWireRenderBuffer, RenderBufferUtils } from "../RenderBuffers";
import { Wire } from "./Wire";
import { RenderManager } from "../RenderManager";
import { EventHandlerMap } from "../../event/eventTypes";
import { Vector2 } from "../../utils/Vector2";

export class PermWire extends Wire<'perm-wire'> {
  protected _kind = 'perm-wire' as const;
  protected renderBuffer: PermWireRenderBuffer = { kind: 'perm-wire' };

  protected toId: string;
  protected toElem: GridElement;
  protected toIdx: number;

  protected endingPos: Vector2;
  
  constructor(
    id: string, renderManager: RenderManager,
    fromId: string, fromElem: GridElement, fromIdx: number,
    toId: string, toElem: GridElement, toIdx: number 
  ) {
    super(
      id, renderManager,
      fromId, fromElem, fromIdx
    );

    this.toId = toId;
    this.toElem = toElem;
    this.toIdx = toIdx;
    this.endingPos = this.calcEndingPos();

    this.updateAndRenderPath();

    console.log(`wire attached from ${this.fromId}, pin ${this.fromIdx} to ${this.toId}, pin ${this.toIdx}`)
  }

  public getEventHandlers(): EventHandlerMap {
    return {
      'grid-element-moved': this.handleGridElementMoved.bind(this)
    }
  }

  private handleGridElementMoved(details: {id: string}) {
    if (details.id === this.fromId) {
      this.startingPos = this.calcStartingPos();
    }
    else if (details.id === this.toId) {
      this.endingPos = this.calcEndingPos();
    }

    this.updateAndRenderPath();
  }

  private updateAndRenderPath() {
    const newPath = this.pathfinder.pathfind(this.startingPos, this.endingPos);
    if (!newPath) {
      console.error(`couldn't pathfind from ${this.startingPos} to ${this.endingPos}`);
      return;
    }

    this.appendRenderBuffer({
      updatedPath: newPath
    });
  }

  private calcEndingPos() {
    return this.toElem.getInputPos(this.toIdx).subtract(1, 0);
  }

  // maybe could be put into wire class but low key sounds long
  protected updateFromBuffer() {
    const newPath = this.renderBuffer.updatedPath;

    if (newPath) {
      this.path = [];

      const firstCell = newPath[0];
      this.path.push(firstCell);

      this.boundingBox.top = firstCell.y;
      this.boundingBox.right = firstCell.x
      this.boundingBox.bottom = firstCell.y;
      this.boundingBox.left = firstCell.x;

      for (let cellIdx = 1; cellIdx < newPath.length; cellIdx++) {
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
    this.drawPathToEndPoint(this.OUTER_WIDTH, 'black');
    this.drawPathToEndPoint(this.INNER_WIDTH, 'lightblue');
  }

  protected resetRenderBuffer(): void {
    this.renderBuffer = { kind: 'perm-wire' };
  }

  protected mergeRenderBuffers(
    original: PermWireRenderBuffer, toAdd: PermWireRenderBuffer
  ): PermWireRenderBuffer {
    const mergedOriginal = RenderBufferUtils.mergeGenericProperties(original, toAdd);

    // update to most recent path
    mergedOriginal.updatedPath = toAdd.updatedPath ?? original.updatedPath;

    return mergedOriginal;

    return mergedOriginal;
  }
}