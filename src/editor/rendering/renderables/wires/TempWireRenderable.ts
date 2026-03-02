import { Vector2 } from "../../../../utils/Vector2";
import { WireRenderable } from "./WireRenderable";
import { Renderer } from "../../Renderer";
import { COLORS, valToColor } from "../../../../theme/colors";
import { RenderState } from "../../RenderManager";
import { Value } from "../../../model/netlist/Value";
import { OutputPin } from "../../../model/chip/Pins";

export class TempWireRenderable extends WireRenderable<'temp-wire'> {
  protected _kind = 'temp-wire' as const; // as const specify typing as 'temp-wire' rather than just a string
  protected isRenderEndConnector: boolean = false;

  constructor(
    id: string,
    renderState: RenderState,
    fromPos: Vector2,
    from: OutputPin
  ) {
    super(id, renderState, from);
    this._startingPos = fromPos;
  }

  public renderFirstLayer(renderer: Renderer): void { }

  public renderSecondLayer(renderer: Renderer): void {
    this.drawStartingSemiCircle(renderer, this.OUTER_PIN_RADIUS, COLORS.outline);
    const lastPoints = this.drawPathToEndPoint(renderer, this.OUTER_WIDTH, COLORS.outline);
    if (this.isRenderEndConnector) {
      this.drawEndPointConnector(renderer, this.OUTER_WIDTH, COLORS.outline, lastPoints);
    }
  }

  public renderThirdLayer(renderer: Renderer): void {
    const val = this.renderState.wires.get(this.id) ?? Value.X;
    const color = valToColor(val);

    const lastPoints = this.drawPathToEndPoint(renderer, this.INNER_WIDTH, COLORS[color]);
    if (this.isRenderEndConnector) {
      this.drawEndPointConnector(renderer, this.INNER_WIDTH, COLORS[color], lastPoints);
    }

    this.drawStartingCirlce(renderer, this.INNER_PIN_RADIUS, COLORS[color]);
  }

  public setRenderEndConnectorFlag(flag: boolean) {
    this.isRenderEndConnector = flag;
  }
}