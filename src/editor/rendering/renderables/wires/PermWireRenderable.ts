import { GridElementRenderable } from "../grid-elements/GridElementRenderable";
import { WireRenderable } from "./WireRenderable";
import { EventHandlerMap } from "../../../event/eventTypes";
import { Vector2 } from "../../../../utils/Vector2";
import { Renderer } from "../../Renderer";
import { COLORS, valToColor } from "../../../../theme/colors";
import { RenderState } from "../../RenderManager";
import { Value } from "../../../model/netlist/Value";

export class PermWireRenderable extends WireRenderable<'perm-wire'> {
  protected _kind = 'perm-wire' as const;

  constructor(
    id: string,
    renderState: RenderState
  ) {
    super(id, renderState);
  }

  public renderFirstLayer(renderer: Renderer): void {

  }

  public renderSecondLayer(renderer: Renderer): void {
    const lastSegmentEndOuter = this.drawPathToEndPoint(renderer, this.OUTER_WIDTH, COLORS.outline);
    this.drawStartingSemiCircle(renderer, this.PIN_RADIUS, COLORS.outline);
    this.drawEndPointConnector(renderer, this.OUTER_WIDTH, COLORS.outline, lastSegmentEndOuter);
    this.drawEndingSemiCircle(renderer, this.PIN_RADIUS, COLORS.outline);
  }

  public renderThirdLayer(renderer: Renderer): void {
    const val = this.renderState.wires.get(this.id) ?? Value.X;
    const color = valToColor(val);

    const lastSegmentEndInner = this.drawPathToEndPoint(renderer, this.INNER_WIDTH, COLORS[color]);
    this.drawEndPointConnector(renderer, this.INNER_WIDTH, COLORS[color], lastSegmentEndInner);
  }
}