import { GridElementRenderable } from "../GridElementRenderable";
import { WireRenderable } from "./WireRenderable";
import { EventHandlerMap } from "../../../event/eventTypes";
import { Vector2 } from "../../../../utils/Vector2";
import { Renderer } from "../../Renderer";
import { COLORS } from "../../../../theme/colors";

export class PermWireRenderable extends WireRenderable<'perm-wire'> {
  protected _kind = 'perm-wire' as const;

  
  constructor(
    id: string
  ) {
    super(
      id
    );
  }

  protected renderObject(renderer: Renderer): void {
    const lastSegmentEndOuter = this.drawPathToEndPoint(renderer, this.OUTER_WIDTH, COLORS.outline);
    this.drawEndPointConnector(renderer, this.OUTER_WIDTH, COLORS.outline, lastSegmentEndOuter);
    const lastSegmentEndInner = this.drawPathToEndPoint(renderer, this.INNER_WIDTH, COLORS.on);
    this.drawEndPointConnector(renderer, this.INNER_WIDTH, COLORS.on, lastSegmentEndInner);
  }

  private drawEndPointConnector(
    renderer: Renderer,
    width: number, color: string,
    lastSegmentEnd: [Vector2, Vector2]
  ) {
    const finalSegmentStartPoints = [
      this._endingPos.add(0.5, 0.5 - width / 2),
      this._endingPos.add(0.5, 0.5 + width / 2)
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
}