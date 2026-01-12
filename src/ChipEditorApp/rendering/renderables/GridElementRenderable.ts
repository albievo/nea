import { Vector2 } from "../../../utils/Vector2";
import { BoundingBox, Renderable } from "./Renderable";
import { Renderer } from "../Renderer";
import { NodeType } from "../../model/netlist/Netlist";
import { COLORS, valToColor } from "../../../theme/colors";
import { Value } from "../../model/netlist/Value";

export class GridElementRenderable extends Renderable<'grid-element'> {
  protected _kind = 'grid-element' as const;

  private type: NodeType

  // in world units
  private _dims: Vector2;
  private _pos: Vector2;

  private inputs: number;
  private outputs: number;

  // -1 means no pin, any other number is the index of the pin
  private inputPositions!: number[];
  private outputPositions!: number[];

  public readonly INNER_PIN_RADIUS = 0.3;
  public readonly OUTER_PIN_RADIUS = 0.375;

  private readonly INNER_INDICATOR_RADIUS = 0.8;
  private readonly OUTER_INDICATOR_RADIUS = 0.875;

  private color: string;

  constructor(details: GridElementDetails) {
    super(details.id);
    
    this.inputs = details.inputs;
    this.outputs = details.outputs;
    this.color = details.color;
    this._pos = details.startingPos.copy();
    this.type = details.type;

    let yDim: number;
    if ( // hard coded to mske common configurations look nicer
      this.inputs === 2 && this.outputs === 1 ||
      this.inputs === 1 && this.outputs === 2 ||
      this.inputs === 1 && this.outputs === 0 ||
      this.inputs === 0 && this.outputs === 1
    ) {
      yDim = 3
    }
    else {
      yDim = Math.max(this.inputs, this.outputs)
    }

    this._dims = new Vector2(
      details.width,
      yDim
    );

    // make position arrays
    this.calcPinPositions();
  }

  public getBoundingBox(): BoundingBox {
    return {
      top: this.pos.y,
      left: this.pos.x,
      right: this.pos.x + this.dims.x,
      bottom: this.pos.y + this.dims.y
    }
  }

  private calcPinPositions() {
    // hard coded as small so making symmetrical is ok
    if (this.inputs === 1 && this.outputs === 2) {
      this.inputPositions = [-1, 0, -1];
      this.outputPositions = [0, -1, 1];
      return;
    }
    if (this.inputs === 2 && this.outputs === 1) {
      this.inputPositions = [0, -1, 1];
      this.outputPositions = [-1, 0, -1];
      return;
    }
    // hard coded as small so take up a significant amount of space
    if (this.inputs === 0 && this.outputs === 1) {
      this.inputPositions = [-1, -1, -1];
      this.outputPositions = [-1, 0, -1];
      return;
    }
    if (this.inputs === 1 && this.outputs === 0) {
      this.inputPositions = [-1, 0, -1];
      this.outputPositions = [-1, -1, -1];
      return;
    }

    // for most cases, place pins as centrally as possible
    if (this.inputs > this.outputs) {
      // fill up inputs like [0, 1, 2, 3...]
      this.inputPositions = Array.from(
        { length: this.dims.y },
        (_, inputIdx) => inputIdx
      );

      // fill up outputs like [-1, -1, 0, 1, 2, -1, -1]
      const topPadding = Math.floor((this.inputs - this.outputs) / 2);
      this.outputPositions = Array.from(
        { length: this.dims.y },
        (_, idx) => {
          const outputIdx = idx - topPadding;
          return (outputIdx >= 0 && outputIdx < this.outputs) ? outputIdx : -1;
        }
      );
    }

    else {
      // fill up outputs like [0, 1, 2, 3...]
      this.outputPositions = Array.from(
        { length: this.dims.y },
        (_, outputIdx) => outputIdx
      );

      // fill up outputs like [-1, -1, 0, 1, 2, -1, -1]
      const topPadding = Math.floor((this.outputs - this.inputs) / 2);
      this.inputPositions = Array.from(
        { length: this.dims.y },
        (_, idx) => {
          const inputIdx = idx - topPadding;
          return (inputIdx >= 0 && inputIdx < this.inputs) ? inputIdx : -1;
        }
      );
    }
  }

  protected renderObject(renderer: Renderer) {
    const color = this.color || 'gray'

    renderer.drawPolygon([
      this.pos,
      this.pos.add(this.dims.x, 0),
      this.pos.add(0, this.dims.y),
      this.pos.add(this.dims)
    ], color);
    // calculate screen radius of pins
    for (let pinIdx = 0; pinIdx < this.dims.y; pinIdx++) {
      const yPos = this.pos.y + pinIdx + 0.5;

      const inputIdx = this.inputPositions[pinIdx]
      // draw the inputs
      if (inputIdx !== -1) { // if we should render a pin here
        const centre = new Vector2(this.pos.x, yPos);
        this.renderInputPin(renderer, centre, Value.ONE);
      }

      const outputIdx = this.outputPositions[pinIdx]
      // draw trhe ouputs 
      if (outputIdx !== -1) { // if we should render a pin here
        const xPos = this.pos.x + this.dims.x
        const centre = new Vector2(xPos, yPos);
        this.renderOutputPin(renderer, centre, Value.ONE);
      }
    }

    // draw bits for input and output elements
    if (this.type === NodeType.CHIP) return;
    const centre = this.pos.add(1.5, 1.5);

    // draw circle for output
    if (this.type === NodeType.OUTPUT) {
      renderer.drawCircle(centre, this.OUTER_INDICATOR_RADIUS, COLORS.outline);
      renderer.drawCircle(centre, this.INNER_INDICATOR_RADIUS, COLORS.on);
    }

    // draw square for output
    if (this.type === NodeType.INPUT) {
      const outerBox: BoundingBox = {
        top: centre.y - this.OUTER_INDICATOR_RADIUS,
        right: centre.x + this.OUTER_INDICATOR_RADIUS,
        bottom: centre.y + this.OUTER_INDICATOR_RADIUS,
        left: centre.x - this.OUTER_INDICATOR_RADIUS,
      }
      const innerBox: BoundingBox = {
        top: centre.y - this.INNER_INDICATOR_RADIUS,
        right: centre.x + this.INNER_INDICATOR_RADIUS,
        bottom: centre.y + this.INNER_INDICATOR_RADIUS,
        left: centre.x - this.INNER_INDICATOR_RADIUS,
      }
      renderer.drawRectFromBox(outerBox, COLORS.outline);
      renderer.drawRectFromBox(innerBox, COLORS.on);
    }
  }

  private renderInputPin(renderer: Renderer, centre: Vector2, state: Value) {
    const color = valToColor(state);
    renderer.drawSemicircle(
      centre, this.OUTER_PIN_RADIUS, 'right', COLORS['outline']
    );
    renderer.drawSemicircle(
      centre, this.INNER_PIN_RADIUS, 'right', COLORS[color]
    );
  }

  private renderOutputPin(renderer: Renderer, centre: Vector2, state: Value) {
    const color = valToColor(state);
    renderer.drawSemicircle(
      centre, this.OUTER_PIN_RADIUS, 'left', COLORS['outline']
    );
    renderer.drawSemicircle(
      centre, this.INNER_PIN_RADIUS, 'left', COLORS[color]
    );
  }

  private getOutputPosIdx(pinIdx: number): number {
    for (let posIdx = 0; posIdx < this.dims.y; posIdx++) {
      if (this.outputPositions[posIdx] === pinIdx) {
        return posIdx
      }
    }
    return -1;
  }

  private getInputPosIdx(pinIdx: number): number {
    for (let posIdx = 0; posIdx < this.dims.y; posIdx++) {
      if (this.inputPositions[posIdx] === pinIdx) {
        return posIdx
      }
    }
    return -1;
  }

  /**
   * get the position of the output pin with index
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
   * get the position of the input pin with index
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

  public get pos(): Vector2 {
    return this._pos.fixedCopy();
  }
  public set pos(pos: Vector2) {
    this._pos = pos;
  }
  public get dims(): Vector2 {
    return this._dims.fixedCopy();
  }
  private set dims(dims: Vector2) {
    this._dims = dims;
  }
}

interface GridElementDetails {
  id: string,
  startingPos: Vector2,
  inputs: number,
  outputs: number,
  width: number, // measured in world units
  color: string,
  type: NodeType
}