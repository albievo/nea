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
    if (details.id === this.toId) { // could be both if it leads to itself
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
    const lastSegmentEndOuter = this.drawPathToEndPoint(this.OUTER_WIDTH, 'black');
    this.drawEndPointConnector(this.OUTER_WIDTH, 'black', lastSegmentEndOuter);
    const lastSegmentEndInner = this.drawPathToEndPoint(this.INNER_WIDTH, 'lightblue');
    this.drawEndPointConnector(this.INNER_WIDTH, 'lightblue', lastSegmentEndInner);

  }

  private drawEndPointConnector(width: number, color: string, lastSegmentEnd: [Vector2, Vector2]) {
    const finalSegmentStartPoints = [
      this.endingPos.add(0.5, 0.5 - width / 2),
      this.endingPos.add(0.5, 0.5 + width / 2)
    ];
    
    const finalSegmentEndPoints = [
      finalSegmentStartPoints[0].add(0.5),
      finalSegmentStartPoints[1].add(0.5)
    ];

    // draw segment
    this.renderManager.drawPolygon([
      finalSegmentStartPoints[0],
      finalSegmentStartPoints[1],
      finalSegmentEndPoints[0],
      finalSegmentEndPoints[1]
    ], color);
    
    // draw connector
    this.renderManager.drawPolygon([
      lastSegmentEnd[0],
      lastSegmentEnd[1],
      finalSegmentStartPoints[0],
      finalSegmentStartPoints[1]
    ], color);
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