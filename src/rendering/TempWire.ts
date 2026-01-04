import { EventHandlerMap } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { BoundingBox, Renderable, RenderableKind } from "./Renderable";
import { AnyRenderBuffer, RenderPayloadUtils, TempWireRenderBuffer } from "./RenderPayloads";
import { RenderManager } from "./RenderManager";
import { AStarPathfinder } from "./pathfinding/AStarPathfinder";
import { merge } from "jquery";
import { MathUtils } from "../utils/MathUtils";

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
  
  // protected renderObject(): void {

  //   const firstSegmentIntersections: [Vector2, Vector2] = [
  //     this.startingPos.add(0, 0.5 - this.WIDTH / 2),
  //     this.startingPos.add(0, 0.5 + this.WIDTH / 2)
  //   ];

  //   const zerothCell = this.startingPos.subtract(1, 0);

  //   const secondSegmentIntersections: [Vector2, Vector2] = 
  //     this.calculateSegmentIntersections(zerothCell, this.path[0], this.path[1]);

  //   this.drawSegment(firstSegmentIntersections, secondSegmentIntersections);

  //   let lastSegmentIntersections = secondSegmentIntersections;

  //   for (let cellIdx = 1; cellIdx < this.path.length - 1; cellIdx++) {
  //     const lastCell = this.path[cellIdx - 1]
  //     const cell = this.path[cellIdx];
  //     const nextCell = this.path[cellIdx + 1]

  //     const currentSegmentIntersections = this.calculateSegmentIntersections(
  //       lastCell, cell, nextCell
  //     );
  //     // console.log(`${lastSegmentIntersections[0].toString()}, ${lastSegmentIntersections[1].toString()}, ${currentSegmentIntersections[0].toString()}, ${currentSegmentIntersections[1].toString()}`)

  //     this.drawSegment(lastSegmentIntersections, currentSegmentIntersections);

  //     lastSegmentIntersections = currentSegmentIntersections;
  //   }

  //   const finalCell = this.path[this.path.length - 1];
  //   const secondFinalCell = this.path[this.path.length - 2];

  //   const finalCellTransition = finalCell.subtract(secondFinalCell);

  //   const ghostFinalCell = finalCell.add(finalCellTransition);

  //   const finalCellIntersections = this.calculateSegmentIntersections(
  //     secondFinalCell, finalCell, ghostFinalCell
  //   );

  //   this.drawSegment(lastSegmentIntersections, finalCellIntersections);
  // }

  protected renderObject(): void {
    const firstSegmentPoints: [Vector2, Vector2] = [
      this.startingPos.add(0, 0.5 - this.WIDTH / 2),
      this.startingPos.add(0, 0.5 + this.WIDTH / 2)
    ];

    let recentEndSegmentPoints: [Vector2, Vector2] = [
      firstSegmentPoints[0].add(0.5, 0),
      firstSegmentPoints[1].add(0.5, 0)
    ];

    this.drawSegment(firstSegmentPoints, recentEndSegmentPoints);

    for (let cellIdx = 1; cellIdx < this.path.length; cellIdx++) {
      const lastCell = this.path[cellIdx - 1];
      const cell = this.path[cellIdx];

      const segmentVertices = this.calculateSegmentVertices(lastCell, cell);

      // draw segment
      this.renderManager.drawPolygon(segmentVertices, 'black');
      // draw segment connector
      this.renderManager.drawPolygon([
        recentEndSegmentPoints[0],
        recentEndSegmentPoints[1],
        segmentVertices[0],
        segmentVertices[1]
      ], 'lightblue');

      recentEndSegmentPoints = [
        segmentVertices [2],
        segmentVertices[3]
      ]
    }
  }
  
  

  private drawSegment(a: [Vector2, Vector2], b: [Vector2, Vector2]) {
    const ctx = this.renderManager.ctx;
    const camera = this.renderManager.camera;

    const points = [a[0], a[1], b[0], b[1]];

    const clockwisePoints = MathUtils.sortPointsClockwise(points);

    ctx.beginPath();

    const firstScreen = camera.worldPosToScreen(clockwisePoints[0])
    ctx.moveTo(firstScreen.x, firstScreen.y);

    for (let pointIdx = 1; pointIdx < 4; pointIdx++) {
      const point = clockwisePoints[pointIdx]
      const pointScreen = camera.worldPosToScreen(point);
      ctx.lineTo(pointScreen.x, pointScreen.y);
    }

    // connect last point back to first
    ctx.closePath();    
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    ctx.fill();

    for (const point of clockwisePoints) {
      ctx.beginPath();
      const pointScreen = camera.worldPosToScreen(point);
      ctx.arc(pointScreen.x, pointScreen.y, 10, 0, Math.PI * 2);
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

  private calculateSegmentIntersections(
    a: Vector2, b: Vector2, c: Vector2
  ): [Vector2, Vector2] {

    // vector from a to c
    const aToC = c.subtract(a);

    // vector perpendicular to the vector from a to c with length half of the width we need
    const perpVector = MathUtils.getPerpVectorWithLength(
      aToC,
      this.WIDTH / 2
    );

    const bCentre = b.add(0.5, 0.5)

    return [
      bCentre.add(perpVector),
      bCentre.subtract(perpVector)
    ]
  }

  private calculateSegmentVertices(
    startCell: Vector2, endCell: Vector2
  ): [Vector2, Vector2, Vector2, Vector2] {
    const relation = endCell.subtract(startCell);
    const perp = MathUtils.getPerpVectorWithLength(relation, this.WIDTH / 2);
    
    const startCellCentre = startCell.add(0.5, 0.5);
    const endCellCentre = endCell.add(0.5, 0.5);

    return [
      startCellCentre.add(perp),
      startCellCentre.subtract(perp),
      endCellCentre.add(perp),
      endCellCentre.subtract(perp)
    ];
  }
}