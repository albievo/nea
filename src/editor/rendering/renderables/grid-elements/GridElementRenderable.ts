import { Vector2 } from "../../../../utils/Vector2";
import { BoundingBox, Renderable } from ".././Renderable";
import { Renderer } from "../../Renderer";
import { NodeType } from "../../../model/netlist/Netlist";
import { ColorKey, COLORS, valToColor } from "../../../../theme/colors";
import { Value } from "../../../model/netlist/Value";
import { RenderState } from "../../RenderManager";
import { ElementRenderable } from "./ElementRenderable";

export class GridElementRenderable extends ElementRenderable<'grid-element'> {
  protected _kind = 'grid-element' as const;
  private renderState: RenderState;

  protected filterColor = "black" as const;
  protected FILTER_OPACITY = 0;

  constructor(details: GridElementDetails) {
    super(
      details.id,
      details.type,
      details.inputs,
      details.outputs,
      details.startingPos.copy(),
      details.width,
      details.color,
      details.name,
      details.iconPath,
      details.label
    );

    this.renderState = details.renderState;
  }

  protected getInputNodeValue(inputIdx: number): Value {
    return this.renderState.inputPins.get(this.id)?.get(inputIdx) ?? Value.X;
  }
  protected getOutputNodeValue(outputIdx: number): Value {
    return this.renderState.outputPins.get(this.id)?.get(outputIdx) ?? Value.X;
  }

  /**
   * get the number of cells from the top that the given output pin idx is at
   * 
   * returns -1 if it doesn't find the given output pin idx
   */
  private getOutputPosIdx(pinIdx: number): number {
    for (let posIdx = 0; posIdx < this.dims.y; posIdx++) {
      if (this.outputPositions[posIdx] === pinIdx) {
        return posIdx
      }
    }
    return -1;
  }

  /**
   * get the number of cells from the top that the given input pin idx is at
   * 
   * returns -1 if it doesn't find the given input pin idx
   */
  private getInputPosIdx(pinIdx: number): number {
    for (let posIdx = 0; posIdx < this.dims.y; posIdx++) {
      if (this.inputPositions[posIdx] === pinIdx) {
        return posIdx
      }
    }
    return -1;
  }

  /**
   * get the world pos of the output pin with index
   */
  public getOutputPos(pinIdx: number): Vector2 {
    const outputPosIdx = this.getOutputPosIdx(pinIdx);

    const outputCell = this.pos.add(new Vector2(
      this.dims.x - 1,
      outputPosIdx
    ));

    return outputCell;
  }

  /**
   * get the world pos of the input pin with index
   */
  public getInputPos(pinIdx: number): Vector2 {
    const inputPosIdx = this.getInputPosIdx(pinIdx);

    const inputCell = this.pos.add(new Vector2(
      0,
      inputPosIdx
    ));

    return inputCell;
  }

  public getOutputPositions(): {pos: number, idx: number}[] {
    const outputIdxs = [];

    // iterate through potential pin positions
    for (let pos = 0; pos < this.dims.y; pos++) {
      // if there is an output pin here
      const pinAtPos = this.outputPositions[pos];
      if (pinAtPos !== -1) outputIdxs.push({
        pos,
        idx: pinAtPos
      });
    }

    return outputIdxs;
  }
  
  public inputAtPos(pos: number) {
    return this.inputPositions[pos];
  }

  public getType() {
    return this.type;
  }

  public updateName(name: string) {
    this.name = name;
  }

  public async updateIcon(img: string): Promise<void> {
    this.iconPath = img;
    return this.initAssets();
  }
}

interface GridElementDetails {
  id: string,
  startingPos: Vector2,
  inputs: number,
  outputs: number,
  width: number, // measured in world units
  color: ColorKey,
  type: NodeType,
  renderState: RenderState,
  iconPath?: string,
  label?: string,
  name: string
}