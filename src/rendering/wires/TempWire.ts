import { EventHandlerMap } from "../../event/eventTypes";
import { Vector2 } from "../../utils/Vector2";
import { BoundingBox, Renderable } from "../Renderable";
import { RenderPayloadUtils, TempWireRenderBuffer } from "../RenderPayloads";
import { RenderManager } from "../RenderManager";
import { AStarPathfinder } from "../pathfinding/AStarPathfinder";
import { MathUtils } from "../../utils/MathUtils";
import { Wire } from "./Wire";
import { GridElement } from "../GridElement";
import events from "../../event/events";
import $ from 'jquery';

export class TempWire extends Wire<'temp-wire'> {
  protected _kind = 'temp-wire' as const; // as const specify typing as 'temp-wire' rather than just a string
  protected renderBuffer: TempWireRenderBuffer = { kind: 'temp-wire' };

  constructor(
    id: string, renderManager: RenderManager,
    fromId: string, fromElem: GridElement, fromIdx: number,
  ) {
    super(
      id, renderManager,
      fromId, fromElem, fromIdx,
    );

    $(document).on('mouseup', () => this.handleMouseUp());
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

  private handleMouseChangedCell(movement: {from: Vector2, to: Vector2}) {
    const takenBy = this.renderManager.availabilityGrid[movement.to.y][movement.to.x];

    if (takenBy.type === 'element') {
      return;
    }

    const newPath = this.pathfinder.pathfind(this.startingPos, movement.to);
    if (!newPath) {
      console.error(`couldn't pathfind from ${this.startingPos} to ${movement.to}`);
      return;
    }

    this.appendRenderBuffer({
      updatedPath: newPath
    });

    const endCell = newPath[newPath.length - 1]
    events.emit('temp-wire-path-updated', { endCell });
  }

  private handleMouseUp() {
    this.delete();
    events.emit('temp-wire-released', {
      fromElement: this.fromId,
      fromOutput: this.fromIdx
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

  private delete() {
    this.renderManager.rmvRenderable(this.id);
    this.rmvDefaultListeners();
    events.emit('render-required');
  }
}