import { EventHandlerMap } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { BoundingBox, Renderable } from "./Renderable";
import { RenderPayloadUtils, TempWireRenderBuffer } from "./RenderPayloads";
import { RenderManager } from "./RenderManager";
import { AStarPathfinder } from "./pathfinding/AStarPathfinder";
import { MathUtils } from "../utils/MathUtils";
import events from "../event/events";
import $ from 'jquery';

export class TempWire extends Renderable<'temp-wire'> {
  protected _kind = 'temp-wire' as const; // as const specify typing as 'temp-wire' rather than just a string
  protected renderBuffer: TempWireRenderBuffer = { kind: 'temp-wire' };

  private path: Vector2[];
  private startingPos: Vector2;

  private outputIdx: number;
  private outputFromElement: string;

  private pathfinder: AStarPathfinder;

  private boundingBox: BoundingBox = { // initialised as 0s
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  } 

  private INNER_WIDTH = 0.3; // width in world units
  private OUTER_WIDTH = 0.4;

  constructor(
    id: string, renderManager: RenderManager,
    startingPos: Vector2,
    outputIdx: number, outputFrom: string
  ) {
    super(id, renderManager);
    
    this.startingPos = startingPos;
    this.path = [startingPos];
    this.outputIdx = outputIdx;
    this.outputFromElement = outputFrom;

    this.pathfinder = new AStarPathfinder(renderManager.availabilityGrid);

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
    this.drawPath(this.OUTER_WIDTH, 'black');
    this.drawPath(this.INNER_WIDTH, 'lightblue');
  }

  protected getBoundingBox(): BoundingBox {
    return this.boundingBox;
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
      fromElement: this.outputFromElement,
      fromOutput: this.outputIdx
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

  private calculateSegmentVertices(
    startCell: Vector2, endCell: Vector2,
    width: number
  ): [Vector2, Vector2, Vector2, Vector2] {
    const relation = endCell.subtract(startCell);
    const perp = MathUtils.getPerpVectorWithLength(relation, width / 2);
    
    const startCellCentre = startCell.add(0.5, 0.5);
    const endCellCentre = endCell.add(0.5, 0.5);

    const startCellExtra = relation.mult(- 0.01); // to stop tiny gaps between segments

    return [
      startCellCentre.add(perp).add(startCellExtra),
      startCellCentre.subtract(perp).add(startCellExtra),
      endCellCentre.add(perp),
      endCellCentre.subtract(perp)
    ];
  }

  private drawPath(width: number, color: string) {
    const firstSegmentPoints: [Vector2, Vector2] = [
      this.startingPos.add(0, 0.5 - width / 2),
      this.startingPos.add(0, 0.5 + width / 2)
    ];

    let recentEndSegmentPoints: [Vector2, Vector2] = [
      firstSegmentPoints[0].add(0.5, 0),
      firstSegmentPoints[1].add(0.5, 0)
    ];

    // draw first segment
    this.renderManager.drawPolygon([
      firstSegmentPoints[0],
      firstSegmentPoints[1],
      recentEndSegmentPoints[0],
      recentEndSegmentPoints[1]
    ], color);

    for (let cellIdx = 1; cellIdx < this.path.length; cellIdx++) {
      const lastCell = this.path[cellIdx - 1];
      const cell = this.path[cellIdx];

      const [a, b, c, d] = this.calculateSegmentVertices(lastCell, cell, width);
      const [e, f] = recentEndSegmentPoints;

      // draw segment
      this.renderManager.drawPolygon([a, b, c, d], color);
      // draw segment connector
      this.renderManager.drawPolygon([e, f, a, b], color);

      recentEndSegmentPoints = [c, d];
    }
  }

  private delete() {
    this.renderManager.rmvRenderable(this.id);
  }
}