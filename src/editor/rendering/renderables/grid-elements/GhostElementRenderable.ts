import { ColorKey } from "../../../../theme/colors";
import { Vector2 } from "../../../../utils/Vector2";
import { NodeType } from "../../../model/netlist/Netlist";
import { Value } from "../../../model/netlist/Value";
import { ElementRenderable } from "./ElementRenderable";

export class GhostElementRenderable extends ElementRenderable<'ghost-element'> {
  protected _kind = "ghost-element" as const;

  protected getInputNodeValue() { return Value.X }
  protected getOutputNodeValue() { return Value.X }

  protected filterColor: ColorKey;
  protected FILTER_OPACITY = 0.5;

  constructor (
    id: string,
    type: NodeType,
    inputs: number,
    outputs: number,
    _pos: Vector2,
    width: number,
    color: ColorKey,
    private validPosition: boolean,
    iconPath?: string
  ) {
    super(id, type, inputs, outputs, _pos, width, color, iconPath);

    this.filterColor = this.getFilterColor();
  }

  private getFilterColor() {
    return this.validPosition ? 'on' : 'off'
  }

  public setValidPosition(validPosition: boolean) {
    this.validPosition = validPosition;
    this.filterColor = this.getFilterColor();
  }
}