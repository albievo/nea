import { Vector2 } from "../../utils/Vector2";
import { ActionDoer } from "../actions/ActionDoer";
import events from "../event/events";
import { AStarPathfinder } from "../rendering/pathfinding/AStarPathfinder";
import { RenderManager } from "../rendering/RenderManager";
import { WorkingChip } from "../WorkingChip";
import { MathUtils } from "../../utils/MathUtils";
import { TempWireRenderable } from "../rendering/renderables/wires/TempWireRenderable";
import { TempWire } from "./objectControllers.ts/TempWire";
import { Chip } from "./objectControllers.ts/Chip";
import { MoveElementAction } from "../actions/action-types/MoveElementAction";

export class InteractionController {
  private pathfinder: AStarPathfinder;

  private lastMouseCell: Vector2 = Vector2.zeroes;

  private onElement: string | null = null;
  private onOutputPin: number = -1;
  
  private draggingElementStartPos = Vector2.zeroes;

  constructor(
    private renderManager: RenderManager,
    private actions: ActionDoer,
    private chip: WorkingChip,
    private interactionState: InteractionState
  ) {
    this.pathfinder = new AStarPathfinder(chip.availabilityGrid);

    events.on('mouse-down', e => this.handleMouseDown(e));
    events.on('mouse-move', e => this.handleMouseMove(e));
    events.on('mouse-up', e => this.handleMouseUp(e));
  }

  /**
   * can have mouse-down-on-pin, mouse-down-on-element and mouse-down-on-grid
  */
  private handleMouseDown(event: { worldPos: Vector2 }) {
    const cell = event.worldPos.applyFunction(Math.floor);
    
    if (this.onOutputPin !== -1 && this.onElement) { // on a pin
      this.createTempWire(this.onElement, this.onOutputPin, cell.add(1, 0)); // create a temporary wire
    }
    else if (this.onElement) { // on an element but not a pin
      // position of the mouse relative to the element
      const elementPos = cell.subtract(
        this.renderManager.getPositionOfElement(
          this.onElement
        )
      );

      this.startElementDrag(this.onElement, elementPos);
    }
    else {
      events.emit('mouse-down-on-grid', {
        worldPos: event.worldPos
      });
    }
  }

  /**
   * can have mouse-changed-cell, mouse-moved-into-element, mouse-moved-off-element
   * temp-wire-path-updated
  */
  private handleMouseMove(event: { worldPos: Vector2 }) {
    const cell = event.worldPos.applyFunction(Math.floor);

    if ( // if out of bounds
      cell.x < 0 ||
      cell.y < 0 ||
      cell.x >= this.chip.worldSize.x ||
      cell.y >= this.chip.worldSize.y
    ) {
      return;
    }

    // if the new cell isn't the same as where we were before,
    // emit the signal and update the last cell
    if (!cell.equals(this.lastMouseCell)) {
      events.emit('mouse-changed-cell', {
        from: this.lastMouseCell,
        to: cell
      });
      this.lastMouseCell = cell;
    }
    else return; // if we haven't changed cell, no reason to do anythings

    // null if nothing there, the elements id if there is an element
    const takenBy = this.chip.cellHasElement(cell);
    // if we are on an element and we havent yet said that we are
    if (!this.onElement && takenBy) {
      this.onElement = takenBy;
      events.emit('mouse-moved-into-element', { elementId: takenBy });
    }
    // if we arent on an element and havent yet said that we arents
    else if (this.onElement && !takenBy) {
      this.onElement = null;
      this.onOutputPin = -1;
      events.emit('mouse-moved-off-element');
    }

    if (this.onElement) {
      this.onOutputPin = this.worldPosIsOnPin(event.worldPos);
    }

    if (this.interactionState.tempWire && !this.onElement) {
      this.updateTempWirePath(this.interactionState.tempWire.renderable, cell);
    }

    // check whether we should be activating an input pin
    if (this.interactionState.tempWire) {
      // check if we are next to or on an input pin
      const elementToTheLeft = this.chip.cellHasElement(cell.subtract(1, 0));
      const elementToTheRight = this.chip.cellHasElement(cell.add(1, 0));

      // the id of the element that we are to the left of.
      // undefined if there isn't one
      let onLeftOfElement;
      if (this.onElement && !elementToTheLeft) { // if we are on the left of an element
        onLeftOfElement = this.onElement;
      }
      else if (!this.onElement && elementToTheRight) { // if we are 1 to the left of an element
        onLeftOfElement = elementToTheRight;
      }

      if (onLeftOfElement) { // if we are next to or on an input pin
        // find the input pin idx at this position
        const elementPos = this.renderManager.getPositionOfElement(
          onLeftOfElement
        );
        const cellsFromTop = cell.y - elementPos.y;
        const inputAtPosition = this.renderManager.inputPinAtPos(
          onLeftOfElement, cellsFromTop
        );

        // if there is an input pin, and it hasn't already been used activate it
        if (
          inputAtPosition !== -1 &&
          !this.chip.isInputTaken(onLeftOfElement, inputAtPosition)
        ) {
          this.interactionState.activePin = {
            elementId: onLeftOfElement,
            pinIdx: inputAtPosition
          }
        }
      }
      else { // if we arent next to or on an input pin
        this.interactionState.activePin = undefined;
      }
    }
  }

  private handleMouseUp(event: { worldPos: Vector2 }) {
    const wireInfo = this.interactionState.tempWire;
    if (wireInfo) { // if a temp wire is being dragged
      this.interactionState.tempWire = undefined;

      const activePin = this.interactionState.activePin
      if (activePin) {
        this.createPermWire(
          wireInfo.fromId, wireInfo.fromIdx,
          activePin.elementId, activePin.pinIdx
        )
      }
    }
    const draggingInfo = this.interactionState.draggingElement;
    if (draggingInfo) { // if an element is being dragged 
      const endPos = Chip.stopRenderableFollowsMouse(
        this.renderManager, draggingInfo.renderableId
      );
      this.actions.do(new MoveElementAction(
        draggingInfo.renderableId,
        draggingInfo.startingPos, endPos
      ));
    }

  }

  private worldPosIsOnPin(worldPos: Vector2): number {
    if (!this.onElement) {
      return -1;
    }

    const outputPins = this.renderManager.getOutputIdxsOfElementWithId(
      this.onElement
    );

    for (const pinPos of outputPins) {
      const pinWorldPos = this.renderManager.getPositionOfElement(
        this.onElement
      );
      const pinRadius = this.renderManager.getPinRadiusOfElement(
        this.onElement
      );
      const pinDims = this.renderManager.getDimsOfElement(
        this.onElement
      );

      const outputDistFromTop = pinPos + 0.5;
      const outputPos = pinWorldPos.add(new Vector2(pinDims.x, outputDistFromTop))
      const distToMouse = MathUtils.calcDistBetweenPoints(worldPos, outputPos);

      if (distToMouse <= pinRadius && worldPos.x <= outputPos.x) {
        return pinPos;
      }
    }
    
    return -1;
  }

  private updateTempWirePath(
    wire: TempWireRenderable,
    endCell: Vector2
  ) {
    const path = TempWire.computePath(
      wire.startingPos,
      endCell,
      this.chip.availabilityGrid
    );
    wire.setPath(path);
  }

  private createTempWire(
    fromId: string, fromIdx: number, fromPos: Vector2
  ) {
    const id = crypto.randomUUID();
    this.interactionState.tempWire = {
      fromId,
      fromIdx,
      renderable: new TempWireRenderable(
        id, fromPos
      )
    };
  }

  private createPermWire(
    fromId: string, fromIdx: number,
    toId: string, toIdx: number
  ) {
    console.log(`should create a perm wire from ${fromId}, ${fromIdx} to ${toId}, ${toIdx}`);
    this.chip.takeInput(toId, toIdx);
  }

  private startElementDrag(id: string, offset: Vector2) {
    const pos = this.renderManager.getPositionOfElement(id);
    if (!pos) return;
    this.interactionState.draggingElement = {
      startingPos: pos,
      renderableId: id
    }

    Chip.renderableFollowsMouse(this.chip, this.renderManager, id, offset);
  }
}

export interface InteractionState {
  tempWire?: {
    renderable: TempWireRenderable;
    fromId: string;
    fromIdx: number;
  }
  activePin?: {
    elementId: string,
    pinIdx: number
  }
  draggingElement?: {
    startingPos: Vector2,
    renderableId: string
  }
}