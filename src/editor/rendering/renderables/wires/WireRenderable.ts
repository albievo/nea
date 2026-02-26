import { Renderable, WireKind, BoundingBox } from "../Renderable";
import { Vector2 } from "../../../../utils/Vector2";
import { MathUtils } from "../../../../utils/MathUtils";
import { Renderer } from "../../Renderer";
import { RenderState } from "../../RenderManager";
import { Color, ColorKey } from "../../../../theme/colors";

export abstract class WireRenderable<K extends WireKind> extends Renderable<K>{
  protected path: Vector2[] = [];
  protected _startingPos = Vector2.zeroes;
  protected _endingPos = Vector2.zeroes;

  protected renderState: RenderState;

  protected boundingBox: BoundingBox = { // initialised as 0s
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  } 

  protected readonly INNER_WIDTH = 0.4; // width in world units
  protected readonly OUTER_WIDTH = 0.5;

  constructor(
    id: string,
    renderState: RenderState
  ) {
    super(id)
    this.renderState = renderState;
  }
  
  protected drawPathToEndPoint(renderer: Renderer, width: number, color: Color) {
    const firstSegmentPoints: [Vector2, Vector2] = [
      this.startingPos.add(0, 0.5 - width / 2),
      this.startingPos.add(0, 0.5 + width / 2)
    ];

    let recentEndSegmentPoints: [Vector2, Vector2] = [
      firstSegmentPoints[0].add(0.5, 0),
      firstSegmentPoints[1].add(0.5, 0)
    ];

    // draw first segment
    renderer.drawPolygon([
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
      renderer.drawPolygon([a, b, c, d], color);
      // draw segment connector
      renderer.drawPolygon([e, f, a, b], color);

      recentEndSegmentPoints = [c, d];
    }

    return recentEndSegmentPoints;
  }

  protected calculateSegmentVertices(
    startCell: Vector2, endCell: Vector2,
    width: number
  ): [Vector2, Vector2, Vector2, Vector2] {
    const relation = endCell.subtract(startCell);
    const perp = MathUtils.getPerpVectorWithLength(relation, width / 2);
    
    const startCellCentre = startCell.add(0.5, 0.5);
    const endCellCentre = endCell.add(0.5, 0.5);

    // to stop tiny gaps between segments
    const startCellExtra = relation.mult(-0.01);
    const endCellExtra = relation.mult(0.01);

    return [
      startCellCentre.add(perp).add(startCellExtra),
      startCellCentre.subtract(perp).add(startCellExtra),
      endCellCentre.add(perp).add(endCellExtra),
      endCellCentre.subtract(perp).add(endCellExtra)
    ];
  }
   
  protected getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  public setPath(newPath: Vector2[]) {
    this.path = [];

    this._startingPos = newPath[0].fixedCopy();
    this.path.push(this._startingPos);

    this.boundingBox.top = this._startingPos.y;
    this.boundingBox.right = this._startingPos.x
    this.boundingBox.bottom = this._startingPos.y;
    this.boundingBox.left = this._startingPos.x;

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

      this.boundingBox.bottom += 1;
      this.boundingBox.right += 1;
    }

    this._endingPos = newPath[newPath.length - 1].fixedCopy();
  }

  public get startingPos() {
    return this._startingPos.fixedCopy();
  }
}