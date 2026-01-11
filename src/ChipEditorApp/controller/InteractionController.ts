import { Vector2 } from "../../utils/Vector2";
import { ActionDoer } from "../actions/ActionDoer";
import events from "../event/events";
import { RenderManager } from "../rendering/RenderManager";
import { WorkingChip } from "../model/WorkingChip";
import { MathUtils } from "../../utils/MathUtils";
import { TempWireRenderable } from "../rendering/renderables/wires/TempWireRenderable";
import { TempWire } from "./objectControllers.ts/TempWire";
import { Chip } from "./objectControllers.ts/Chip";
import { MoveElementAction } from "../actions/action-types/MoveElementAction";
import { Camera } from "../rendering/Camera";
import { InteractionState } from "./InteractionState";

export class InteractionController {
  private lastMouseCell: Vector2 = Vector2.zeroes;
  
  constructor(
    private renderManager: RenderManager,
    private actions: ActionDoer,
    private chip: WorkingChip,
    private interactionState: InteractionState,
    private camera: Camera
  ) {
    events.on('mouse-down', e => this.handleMouseDown(e));
    events.on('mouse-move', e => this.handleMouseMove(e));
    events.on('mouse-up', e => this.handleMouseUp(e));
    events.on('wheel', e => this.handleWheel(e));
    events.on('space-down', e => interactionState.space = true);
    events.on('space-up', e => interactionState.space = false);
  }

  /**
   * can have mouse-down-on-pin, mouse-down-on-element and mouse-down-on-grid
  */
  private handleMouseDown(event: { worldPos: Vector2 }) {
    const cell = event.worldPos.applyFunction(Math.floor);

    if (this.interactionState.space) {
      this.interactionState.panning = { mouseDown: event.worldPos };
      return;
    }
    
    const onElement = this.interactionState.onElement;
    const onOutputPin = this.interactionState.onOutputPin
    if (
      onOutputPin !== undefined &&
      onElement
    ) { // on a pin
      this.createTempWire(
        onElement,
        onOutputPin,
        cell.add(1, 0)
      ); // create a temporary wire
    }
    else if (onElement) { // on an element but not a pin
      // position of the mouse relative to the element
      const elementPos = cell.subtract(
        this.renderManager.getPositionOfElement(onElement)
      );

      this.startElementDrag(onElement, elementPos);
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

    const panning = this.interactionState.panning
    if (panning) {
      const newPos = event.worldPos;
      const delta = newPos.subtract(panning.mouseDown);

      this.camera.panBy(delta);
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

    // null if nothing there, the elements id if there is an element
    const takenBy = this.chip.cellHasElement(cell);
    const onElement = this.interactionState.onElement;
    // if we are on an element and we havent yet said that we are
    if (!onElement && takenBy) {
      this.interactionState.onElement = takenBy;
      events.emit('mouse-moved-into-element', { elementId: takenBy });
    }
    // if we arent on an element and havent yet said that we arent
    else if (onElement && !takenBy) {
      this.interactionState.onElement = undefined;
      this.interactionState.onOutputPin = undefined;
      events.emit('mouse-moved-off-element');
    }

    if (onElement) {
      this.interactionState.onOutputPin = this.worldPosIsOnPin(event.worldPos);
    }

    if (this.interactionState.tempWire && !onElement) {
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
      if (onElement && !elementToTheLeft) { // if we are on the left of an element
        onLeftOfElement = onElement;
      }
      else if (!onElement && elementToTheRight) { // if we are 1 to the left of an element
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
          this.interactionState.activeInputPin = {
            elementId: onLeftOfElement,
            pinIdx: inputAtPosition
          }
        }
      }
      else { // if we arent next to or on an input pin
        this.interactionState.activeInputPin = undefined;
      }
    }
  }

  private handleMouseUp(event: { worldPos: Vector2 }) {
    const wireInfo = this.interactionState.tempWire;
    if (wireInfo) { // if a temp wire is being dragged
      this.interactionState.tempWire = undefined;

      const activeInputPin = this.interactionState.activeInputPin
      if (activeInputPin) {
        this.createPermWire(
          wireInfo.fromId, wireInfo.fromIdx,
          activeInputPin.elementId, activeInputPin.pinIdx
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

    const panningInfo = this.interactionState.panning;
    if (panningInfo) {
      this.interactionState.panning = undefined
    }
  }

  private handleWheel(event: { delta: Vector2, worldPos: Vector2 }) {
    this.camera.zoomAt(event.worldPos, event.delta.y);
  }

  private worldPosIsOnPin(worldPos: Vector2): number | undefined {
    const onElement = this.interactionState.onElement

    if (!onElement) return undefined;

    const outputPins = this.renderManager.getOutputIdxsOfElementWithId(
      onElement
    );

    for (const pinPos of outputPins) {
      const pinWorldPos = this.renderManager.getPositionOfElement(
        onElement
      );
      const pinRadius = this.renderManager.getPinRadiusOfElement(
        onElement
      );
      const pinDims = this.renderManager.getDimsOfElement(
        onElement
      );

      const outputDistFromTop = pinPos + 0.5;
      const outputPos = pinWorldPos.add(new Vector2(pinDims.x, outputDistFromTop))
      const distToMouse = MathUtils.calcDistBetweenPoints(worldPos, outputPos);

      if (distToMouse <= pinRadius && worldPos.x <= outputPos.x) {
        return pinPos;
      }
    }
    
    return undefined;
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