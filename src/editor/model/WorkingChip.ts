import { Vector2 } from "../../utils/Vector2";
import events from "../event/events";
import { GeneralUtils } from "../../utils/GeneralUtils";
import { Netlist, NetlistNode, NodeType } from "./netlist/Netlist";
import { ChipBehaviour, NetlistBehaviour } from "./chip/ChipBehaviour";
import { BoundingBox } from "../rendering/renderables/Renderable";
import { InputPin, OutputPin } from "./chip/Pins";
import { Connection } from "./netlist/Connection";
import { Value } from "./netlist/Value";
import { RenderState } from "../rendering/RenderManager";
import { SerializedNetlist } from "./netlist/SerializedNetlist";
import { ChipLibrary, GenericChipDetails } from "./chip/ChipLibrary";

export class WorkingChip {
  private chipPositionsById = new Map<string, Vector2>();
  private chipLabelsById = new Map<string, string>();
  private netlist = new Netlist([], []);
  private _availabilityGrid: CellTakenBy[][];
  private _takenInputs = new Map<string, Map<number, boolean>>;

  constructor(
    public worldSize: Vector2,
    private chipLibrary: ChipLibrary
  ) {
    this._availabilityGrid = GeneralUtils.createMatrixOfVals(
      () => ({ type: undefined, ids: [] }), worldSize.y, worldSize.x
    );
  }

  public updateChipPosition(
    chipId: string,
    oldPos: Vector2, newPos: Vector2,
    dims: Vector2
  ) {
    // remove old positions (not yet implemented)
    this.rmvElementFromCellInBox({
      top: oldPos.y, bottom: oldPos.y + dims.y - 1,
      left: oldPos.x, right: oldPos.x + dims.x - 1
    })

    // add new positions
    this.addElementToCellInBox(chipId, {
      top: newPos.y, bottom: newPos.y + dims.y - 1,
      left: newPos.x, right: newPos.x + dims.x - 1
    })

    // add to table
    this.chipPositionsById.set(chipId, newPos);
  }

  public get availabilityGrid() {
    return this._availabilityGrid;
  }

  public addElementToCell(pos: Vector2, id: string) {
     this.availabilityGrid[pos.y][pos.x] = { type: 'element', ids: [id] };
  }

  public rmvElementFromCell(pos: Vector2) {
    this.availabilityGrid[pos.y][pos.x] = { type: undefined, ids: [] };
  }

  public addElementToCellInBox(id: string, bb: BoundingBox) {
    for (let x = bb.left; x <= bb.right; x++) {
      for (let y = bb.top; y <= bb.bottom; y++) {
        const cell = new Vector2(x, y)
        this.addElementToCell(cell, id);
      }
    }
  }

  public rmvElementFromCellInBox(bb: BoundingBox) {
    for (let x = bb.left; x <= bb.right; x++) {
      for (let y = bb.top; y <= bb.bottom; y++) {
        const cell = new Vector2(x, y)
        this.rmvElementFromCell(cell);
      }
    }
  }

  public addWireToCell(pos: Vector2, id: string) {
    const cellTakenBy = this.availabilityGrid[pos.y][pos.x];

    if (cellTakenBy.type === 'element') return;

    cellTakenBy.type = 'wire';
    cellTakenBy.ids.push(id);
  }

  public cellHasElement(pos: Vector2): string | null {
    if (
      pos.x < 0 ||
      pos.x >= this.worldSize.x ||
      pos.y < 0 ||
      pos.y >= this.worldSize.y
    ) return null;

    return (
      this.availabilityGrid[pos.y][pos.x].type === 'element'
        ? this.availabilityGrid[pos.y][pos.x].ids[0]
        : null
    ); 
  }

  private takeInput(id: string, idx: number) {
    let elementInputs = this._takenInputs.get(id);

    if (!elementInputs) {
      elementInputs = new Map<number, boolean>();
      this._takenInputs.set(id, elementInputs);
    }

    elementInputs.set(idx, true);
  }

  private releaseInput(id: string, idx: number) {
    let elementInputs = this._takenInputs.get(id);

    if (!elementInputs) return;

    elementInputs.set(idx, false);
  }
  
  public isInputTaken(id: string, idx: number): boolean {
    let elementInputs = this._takenInputs.get(id);
    if (!elementInputs) return false;
    return !!elementInputs.get(idx); // converts falsy (e.g. undefined) to false
  }

  public addChip(
    id: string, pos: Vector2, dims: Vector2,
    dets: GenericChipDetails
  ) {
    try {
      this.netlist.addNode(new NetlistNode(
        id, dets, this.chipLibrary
      ))
    } catch (err) {
      console.error(err);
      return;
    }

    this.chipPositionsById.set(id, pos);
    this.addChipLabel(id, dets.type);
    
    this.addElementToCellInBox(id, {
      top: pos.y, bottom: pos.y + dims.y - 1,
      left: pos.x, right: pos.x + dims.x - 1
    })
  }

  public rmvChip(
    id: string
  ) {
    this.netlist.rmvNode(id);

    for (let x = 0; x < this.worldSize.y; x++) {
      for (let y = 0; y < this._availabilityGrid.length; y++) {
        if (this._availabilityGrid[y][x].ids.includes(id)) {
          this.rmvElementFromCell(new Vector2(x, y))
        }
      }
    }
  }

  private addChipLabel(id: string, type: NodeType) {
    if (type === NodeType.CHIP) return;
    const name = type === NodeType.INPUT ? 'Input' : 'Output'
    this.chipLabelsById.set(id, name);
  }

  public setChipLabel(id: string, text: string): string {
    const isValid = this.validateLabel(text);
    if (isValid) {
      this.chipLabelsById.set(id, text);
    }
    return this.chipLabelsById.get(id);
  }

  private validateLabel(text: string): boolean {
    return text.length > 0 && text.length < 32;
  }
  
  public isValidPosition(
    boundingBox: BoundingBox, id?: string
  ) {
    // check the element is within the bounds of the world
    if (boundingBox.top <= 0) return false;
    if (boundingBox.left <= 0) return false;
    if (boundingBox.bottom >= this.worldSize.y) return false;
    if (boundingBox.right >= this.worldSize.x) return false;

    // iterate through each cell that will be taken by the element
    // and ensure that it is availabile
    for (let x = boundingBox.left - 1; x <= boundingBox.right; x++) {
      for (let y = boundingBox.top - 1; y <= boundingBox.bottom; y++) {
        const cellTakenBy = this.availabilityGrid[y][x];

        if (
          cellTakenBy &&
          cellTakenBy.type === 'element' &&
          cellTakenBy.ids[0] !== id
        ) {
          return false;
        }
      }
    }

    return true
  }

  public addConnection(
    id: string,
    from: OutputPin, to: InputPin
  ) {
    this.netlist.addConnection(new Connection(
      id, from, to
    ))
    this.takeInput(to.nodeId, to.inputIdx);
  }

  public rmvConnection(id: string) {
    const input = this.netlist.getConnectionTo(id);
    if (!input) return;

    this.netlist.rmvConnection(id);
    this.releaseInput(input.nodeId, input.inputIdx);
  }

  public getConnection(id: string): Connection | undefined {
    return this.netlist.getConnection(id);
  }

  /**
   * returns the render state after the evaluation
   */
  public updateNetlist(inputs: Map<string, Value>): RenderState {
    this.netlist.evaluate(inputs);
    return this.netlist.getRenderState();
  }

  public validate(): string | undefined {
    if (!this.netlist.hasInputAndOutput()) {
      return 'Circuit must have at least one input and one output'
    }
    if (!this.netlist.fullyConnected()) {
      return 'Circuit not fully connected - ensure each pin has at least 1 connection'
    }
  }

  public isStatic(): boolean {
    return this.netlist.isStatic();
  }

  public getNetlist(): Netlist {
    return this.netlist.copy();
  }

  public inputIdsToName(): Map<string, string> {
    const map = new Map<string, string>();

    for (const inputId of this.netlist.getInputNodes()) {
      const name = this.chipLabelsById.get(inputId);
      map.set(inputId, name);
    }

    return map;
  }

  public outputIdsToName(): Map<string, string> {
    const map = new Map<string, string>();

    for (const outputId of this.netlist.getOutputNodes()) {
      const name = this.chipLabelsById.get(outputId);
      map.set(outputId, name);
    }

    return map;
  }

  public getSerializedNetlist(): SerializedNetlist {
    return this.netlist.serialize();
  }

  public inputNum() {
    return this.netlist.getInputNum();
  }

  public outputNum() {
    return this.netlist.getOutputNum();
  }
}

export interface CellTakenBy {
  type?: 'wire' | 'element' | 'none',
  ids: string[]
}