import { GridElementRenderable } from "../GridElementRenderable";
import { Wire } from "./Wire";
import { RenderManager } from "../../RenderManager";
import { EventHandlerMap } from "../../../event/eventTypes";
import { Vector2 } from "../../../../utils/Vector2";
import { Renderer } from "../../Renderer";

export class PermWireRenderable extends Wire<'perm-wire'> {
  protected _kind = 'perm-wire' as const;
  protected endingPos: Vector2;
  protected _startingPos: Vector2;
  
  constructor(
    id: string,
    private readonly fromId: string,
    private readonly fromElem: GridElementRenderable,
    private readonly fromIdx: number,
    private readonly toId: string,
    private readonly toElem: GridElementRenderable,
    private readonly toIdx: number 
  ) {
    super(
      id
    );
    this.endingPos = this.calcEndingPos();
    this._startingPos = this.calcStartingPos();
    // this.updateAndRenderPath();
  }

  public getEventHandlers(): EventHandlerMap {
    return {
      'grid-element-moved': this.handleGridElementMoved.bind(this)
    }
  }

  private handleGridElementMoved(details: {id: string}) {
    if (details.id === this.fromId) {
      this._startingPos = this.calcStartingPos();
    }
    if (details.id === this.toId) { // could be both if it leads to itself
      this.endingPos = this.calcEndingPos();
    }

    // this.updateAndRenderPath();
  }

  // private updateAndRenderPath() {
  //   const newPath = this.pathfinder.pathfind(this.startingPos, this.endingPos);
  //   if (!newPath) {
  //     console.error(`couldn't pathfind from ${this.startingPos} to ${this.endingPos}`);
  //     return;
  //   }

  //   this.setPath(newPath);
  // }

  private calcEndingPos() {
    return this.toElem.getInputPos(this.toIdx).subtract(1, 0);
  }

  protected renderObject(renderer: Renderer): void {
    const lastSegmentEndOuter = this.drawPathToEndPoint(renderer, this.OUTER_WIDTH, 'black');
    this.drawEndPointConnector(renderer, this.OUTER_WIDTH, 'black', lastSegmentEndOuter);
    const lastSegmentEndInner = this.drawPathToEndPoint(renderer, this.INNER_WIDTH, 'lightblue');
    this.drawEndPointConnector(renderer, this.INNER_WIDTH, 'lightblue', lastSegmentEndInner);

  }

  private drawEndPointConnector(
    renderer: Renderer,
    width: number, color: string,
    lastSegmentEnd: [Vector2, Vector2]
  ) {
    const finalSegmentStartPoints = [
      this.endingPos.add(0.5, 0.5 - width / 2),
      this.endingPos.add(0.5, 0.5 + width / 2)
    ];
    
    const finalSegmentEndPoints = [
      finalSegmentStartPoints[0].add(0.5, 0),
      finalSegmentStartPoints[1].add(0.5, 0)
    ];

    // draw segment
    renderer.drawPolygon([
      finalSegmentStartPoints[0],
      finalSegmentStartPoints[1],
      finalSegmentEndPoints[0],
      finalSegmentEndPoints[1]
    ], color);
    
    // draw connector
    renderer.drawPolygon([
      lastSegmentEnd[0],
      lastSegmentEnd[1],
      finalSegmentStartPoints[0],
      finalSegmentStartPoints[1]
    ], color);
  }

  protected calcStartingPos(): Vector2 {
    return this.fromElem.getOutputPos(this.fromIdx).add(1, 0);
  }
}