import { Vector2 } from "../../../../utils/Vector2";
import { WireRenderable } from "./WireRenderable";
import { Renderer } from "../../Renderer";
import { COLORS, valToColor } from "../../../../theme/colors";
import { RenderState } from "../../RenderManager";
import { Value } from "../../../model/netlist/Value";

export class TempWireRenderable extends WireRenderable<'temp-wire'> {
  protected _kind = 'temp-wire' as const; // as const specify typing as 'temp-wire' rather than just a string

  constructor(
    id: string,
    renderState: RenderState,
    fromPos: Vector2
  ) {
    super(id, renderState);
    this._startingPos = fromPos;
  }

  public renderFirstLayer(renderer: Renderer): void { }

  public renderSecondLayer(renderer: Renderer): void { 
    this.drawPathToEndPoint(renderer, this.OUTER_WIDTH, COLORS.outline);
  }

  public renderThirdLayer(renderer: Renderer): void {
    const val = this.renderState.wires.get(this.id) ?? Value.X;
    const color = valToColor(val);

    this.drawPathToEndPoint(renderer, this.INNER_WIDTH, COLORS[color]);
  }
}