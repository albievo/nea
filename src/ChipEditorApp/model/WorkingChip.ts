import { Vector2 } from "../../utils/Vector2";
import events from "../event/events";
import { MouseTracker } from "../rendering/MouseTracker";
import { GeneralUtils } from "../../utils/GeneralUtils";
import { Netlist, NetlistNode, NodeType } from "./netlist/Netlist";
import { NetlistBehaviour } from "./netlist/ChipBehaviour";
import { BoundingBox } from "../rendering/renderables/Renderable";

export class WorkingChip {
  private chipPositionsById = new Map<string, Vector2>;
  private netlist = new Netlist([], []);
  private _availabilityGrid: CellTakenBy[][];
  private _takenInputs = new Map<string, Map<number, boolean>>;

  constructor(
    public worldSize: Vector2
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
    console.log(`setting ${pos.toString()} to ${id}`);
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
    return (
      this.availabilityGrid[pos.y][pos.x].type === 'element'
        ? this.availabilityGrid[pos.y][pos.x].ids[0]
        : null
    ); 
  }

  public takeInput(id: string, idx: number) {
    let elementInputs = this._takenInputs.get(id);

    if (!elementInputs) {
      elementInputs = new Map<number, boolean>();
      this._takenInputs.set(id, elementInputs);
    }

    elementInputs.set(idx, true);
  }

  public releaseInput(id: string, idx: number) {
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
    type: NodeType, behaviour?: NetlistBehaviour
  ) {
    try {
      this.netlist.addNode(new NetlistNode(
        id, type, behaviour
      ))
    } catch (err) {
      console.error(err);
      return;
    }

    this.chipPositionsById.set(id, pos);
    
    this.addElementToCellInBox(id, {
      top: pos.y, bottom: pos.y + dims.y - 1,
      left: pos.x, right: pos.x + dims.x - 1
    })
  }

  public rmvChip(
    id: string
  ) {
    this.netlist.rmvNode(id);
  }

  
  public isValidPosition(
    id: string, boundingBox: BoundingBox
  ) {
    // check the element is within the bounds of the world
    if (boundingBox.top <= 0) return false;
    if (boundingBox.left <= 0) return false;
    if (boundingBox.bottom >= this.worldSize.y - 1) return false;
    if (boundingBox.right >= this.worldSize.x - 1) return false;

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
}

export interface CellTakenBy {
  type?: 'wire' | 'element',
  ids: string[]
}