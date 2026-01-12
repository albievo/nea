import { Vector2 } from "../../../../utils/Vector2";
import { WireRenderable } from "./WireRenderable";
import { Renderer } from "../../Renderer";
import { COLORS } from "../../../../theme/colors";

export class TempWireRenderable extends WireRenderable<'temp-wire'> {
  protected _kind = 'temp-wire' as const; // as const specify typing as 'temp-wire' rather than just a string
  protected _startingPos: Vector2;

  constructor(
    id: string,
    fromPos: Vector2
  ) {
    super(
      id
    );
    this._startingPos = fromPos
  }

  protected renderObject(renderer: Renderer): void {
    this.drawPathToEndPoint(renderer, this.OUTER_WIDTH, COLORS.outline);
    this.drawPathToEndPoint(renderer, this.INNER_WIDTH, COLORS.on);
  }

  // private handleMouseChangedCell(movement: {from: Vector2, to: Vector2}) {
  //   const takenBy = this.renderManager.availabilityGrid[movement.to.y][movement.to.x];

  //   if (takenBy.type === 'element') {
  //     return;
  //   }

  //   const newPath = this.pathfinder.pathfind(this.startingPos, movement.to);
  //   if (!newPath) {
  //     console.error(`couldn't pathfind from ${this.startingPos} to ${movement.to}`);
  //     return;
  //   }

  //   this.setPath(newPath);

  //   const endCell = newPath[newPath.length - 1]
  //   events.emit('temp-wire-path-updated', { endCell });
  // }

  // private handleMouseUp() {
  //   this.delete();
  //   events.emit('temp-wire-released', {
  //     fromElement: this.fromId,
  //     fromOutput: this.fromIdx
  //   });
  // }
}