import { BoundingBox, Renderable, RenderableKind } from "./Renderable";
import { Vector2 } from "../../../utils/Vector2";
import { Renderer } from "../Renderer";
import { COLORS } from "../../../theme/colors";

export class GridRenderable extends Renderable<'grid'> {
  protected _kind = 'grid' as const;
  
  constructor(
    id: string,
    private size: Vector2
  ) {
    super(id);
  }

  protected getBoundingBox(): BoundingBox {
    return {
      top: 0,
      left: 0,
      right: this.size.x + 1,
      bottom: this.size.y + 1 
    }
  }

  protected renderObject(renderer: Renderer) {
    const cameraBoundingBox = renderer.getScreenBoundingBox();

    const startRow = Math.ceil(cameraBoundingBox.top);
    const endRow = Math.floor(cameraBoundingBox.bottom);
    const startCol = Math.ceil(cameraBoundingBox.left);
    const endCol = Math.floor(cameraBoundingBox.right);

    //draw rows
    for (let row = startRow; row <= endRow; row++) {
      const from = new Vector2(cameraBoundingBox.left, row);
      const to = new Vector2(cameraBoundingBox.right, row);
      renderer.drawLine({ from, to }, COLORS.gridLine);
    }

    //draw columns
    for (let col = startCol; col <= endCol; col++) {
      const from = new Vector2(col, cameraBoundingBox.top)
      const to = new Vector2(col, cameraBoundingBox.bottom);
      renderer.drawLine({ from, to }, COLORS.gridLine);
    }
  }
}