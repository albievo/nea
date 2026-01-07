import { GridElement } from "../GridElement";
import { Wire } from "./Wire";
import { RenderManager } from "../RenderManager";
import { EventHandlerMap } from "../../event/eventTypes";
import { Vector2 } from "../../utils/Vector2";

export class PermWire extends Wire<'perm-wire'> {
  protected _kind = 'perm-wire' as const;

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

    this.setPath(newPath);
  }

  private calcEndingPos() {
    return this.toElem.getInputPos(this.toIdx).subtract(1, 0);
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
      finalSegmentStartPoints[0].add(0.5, 0),
      finalSegmentStartPoints[1].add(0.5, 0)
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
}