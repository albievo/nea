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
import { CursorHandler } from "../rendering/CursorHandler";
import { CreateConnectionAction } from "../actions/action-types/CreateConnectionAction";
import { Wire } from "./objectControllers.ts/Wire";
import { NodeType } from "../model/netlist/Netlist";
import { BoundingBox } from "../rendering/renderables/Renderable";
import { Value } from "../model/netlist/Value";
import { InvertInputAction } from "../actions/action-types/InvertInputAction";
import { CreateChipElementAction, generateCreateElementAction } from "../actions/action-types/CreateElementAction";
import { ChipLibrary } from "../model/chip/ChipLibrary";
import { OutputPin } from "../model/chip/Pins";

export class InteractionController {
  private lastMouseCell: Vector2 = Vector2.zeroes;
  
  constructor(
    private renderManager: RenderManager,
    private actions: ActionDoer,
    private chip: WorkingChip,
    private interactionState: InteractionState,
    private camera: Camera,
    private cursorHandler: CursorHandler,
    private chipLibrary: ChipLibrary
  ) {
    events.on('mouse-down', e => this.handleMouseDown(e));
    events.on('mouse-move', e => this.handleMouseMove(e));
    events.on('mouse-up', e => this.handleMouseUp(e));
    events.on('wheel', e => this.handleWheel(e));
    events.on('space-down', e => {
      interactionState.space = true
      this.cursorHandler.updateCursor();
    });
    events.on('space-up', e => {
      interactionState.space = false
      this.cursorHandler.updateCursor();
    });
    events.on('ctrl-z', () => this.handleUndo());
    events.on('ctrl-y', () => this.handleRedo());
    events.on('label-input-submit', e => this.handleLabelInputSubmit(e));
  }

  /**
   * can have mouse-down-on-pin, mouse-down-on-element and mouse-down-on-grid
  */
  private handleMouseDown(event: { worldPos: Vector2 }) {
    const cell = event.worldPos.applyFunction(Math.floor);

    if (this.interactionState.space) {
      this.interactionState.panning = { mouseDown: event.worldPos };
      this.cursorHandler.updateCursor();
      return;
    }
    
    const onElement = this.interactionState.onElement;

    const onOutputPin = this.interactionState.onOutputPin
    if (onOutputPin !== undefined) { // on a pin
      this.createTempWire(
        onOutputPin.nodeId,
        onOutputPin.outputIdx
      ); // create a temporary wire

      this.updateTempWire(cell);

      this.cursorHandler.updateCursor();
    }

    if (!onElement || onOutputPin) return; // the rest is only for if we're on an element: otherwise, skip

    if (this.interactionState.onInputBtn && !onOutputPin) {
      // invert the value of the state
      this.actions.do(new InvertInputAction(onElement));
    }
    else { // on an element but not an interactable
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
    // update the last cell and emit the event
    // and check if we need to move the ghost element
    const cellHasChanged = !cell.equals(this.lastMouseCell)
    if (cellHasChanged) {
      events.emit('mouse-changed-cell', { from: this.lastMouseCell, to: cell });
      this.lastMouseCell = cell;

      const ghostElementInfo = this.interactionState.ghostElement;
      if (ghostElementInfo) {
        ghostElementInfo.renderable.pos = cell;
        const validPosition = Chip.checkValidPosition(
          this.chip, cell, ghostElementInfo.renderable.dims
        );
        ghostElementInfo.renderable.setValidPosition(validPosition);
        ghostElementInfo.validPosition = validPosition;
      }
    }

    // null if nothing there, the elements id if there is an element
    const onElement = this.chip.cellHasElement(cell) ?? undefined;
    this.interactionState.onElement = onElement;
    let onRenderable = onElement
      ? this.renderManager.getGridElementWithId(onElement)
      : undefined;

    // check if we are on a pin
    const rightOfElement = this.chip.cellHasElement(cell.subtract(1, 0));
    const elementToCheck = (rightOfElement ?? onElement);
    if (elementToCheck) {
    this.interactionState.onOutputPin = this.worldPosIsOnPin(event.worldPos, elementToCheck);
    }

    // check if we are on another interactable part
    if (onElement) {
      // check if we are on an input button
      if (onRenderable && onRenderable.getType() === NodeType.INPUT) {
        this.interactionState.onInputBtn = this.posIsOnInputBtn(
          onElement, event.worldPos
        );
      }
    }

    // if we should be updating a temp wire path
    if (this.interactionState.tempWire && !onElement && cellHasChanged) {
      this.updateTempWirePath(this.interactionState.tempWire.renderable, cell);
    }

    // check whether we should be activating an input pin
    if (this.interactionState.tempWire && cellHasChanged) {
      this.updateTempWire(cell);
    }

    this.cursorHandler.updateCursor();
  }

  private handleMouseUp(event: { worldPos: Vector2 }) {
    const wireInfo = this.interactionState.tempWire;
    if (wireInfo) { // if a temp wire is being dragged
      // get rid of the temp wire
      this.interactionState.tempWire = undefined;

      const activeInputPin = this.interactionState.activeInputPin
      if (activeInputPin) {
        this.actions.do(new CreateConnectionAction(
          crypto.randomUUID(),
          { nodeId: wireInfo.fromId, outputIdx: wireInfo.fromIdx },
          activeInputPin
        ));
      }

      this.cursorHandler.updateCursor();
    }

    const draggingInfo = this.interactionState.draggingElement;
    if (draggingInfo) { // if an element is being dragged 
      const endPos = Chip.stopGridElementFollowsMouse(
        this.renderManager, draggingInfo.renderableId
      );
      this.actions.do(new MoveElementAction(
        draggingInfo.renderableId,
        draggingInfo.startingPos, endPos
      ));
      // tell render manager to stop tracking preview info
      this.renderManager.previewMatchesCanon();
      this.interactionState.draggingElement = undefined;
    }

    const panningInfo = this.interactionState.panning;
    if (panningInfo) { // if the camera is panning
      this.interactionState.panning = undefined;
      this.cursorHandler.updateCursor();
    }

    const ghostElementInfo = this.interactionState.ghostElement;
    if (ghostElementInfo) { // if there is a ghost element
      this.interactionState.ghostElement = undefined;

      // if at a valid pos, create a new element there
      if (ghostElementInfo.validPosition) {
        this.actions.do(generateCreateElementAction(
          crypto.randomUUID(),
          ghostElementInfo.renderable.pos,
          ghostElementInfo.details
        ));
      }

      this.cursorHandler.updateCursor();
    }
  }

  private handleWheel(event: { delta: Vector2, worldPos: Vector2 }) {
    this.camera.zoomAt(event.worldPos, event.delta.y);
  }

  private handleUndo() {
    this.actions.undo();
  }

  private handleRedo() {
    this.actions.redo();
  }

  private handleLabelInputSubmit(e: { text: string, labeledElem: string }) {
    const labelText = this.chip.setChipLabel(e.labeledElem, e.text);
    this.renderManager.setElemLabel(e.labeledElem, labelText);
  }

  private worldPosIsOnPin(worldPos: Vector2, element: string): OutputPin | undefined {
    if (!element) return undefined;

    const outputPins = this.renderManager.getOutputIdxsOfElementWithId(
      element
    );

    for (const pin of outputPins) {
      const onElementPos = this.renderManager.getPositionOfElement(
        element
      );
      const pinRadius = this.renderManager.getPinRadiusOfElement(
        element
      );
      const onElementDims = this.renderManager.getDimsOfElement(
        element
      );

      const outputDistFromTop = pin.pos + 0.5;
      const outputPos = onElementPos.add(onElementDims.x, outputDistFromTop);
      const distToMouse = MathUtils.calcDistBetweenPoints(worldPos, outputPos);

      if (distToMouse <= pinRadius) {
        return {
          nodeId: element,
          outputIdx: pin.idx
        }
      }
    }
    
    return undefined;
  }

  private updateTempWirePath(
    wire: TempWireRenderable,
    endCell: Vector2,
    endConnector?: boolean
  ) {
    endConnector = endConnector ?? false;

    const path = Wire.computePath(
      wire.startingPos,
      endCell,
      this.chip.availabilityGrid,
      this.renderManager.previewAvailabilityOverlay
    );

    if (endConnector) {
      path.push(endCell.add(1, 0));
    }

    wire.setPath(path);
  }

  private createTempWire(
    fromId: string, fromIdx: number
  ) {
    const fromPos = this.renderManager.getPosOfOutputPin(fromId, fromIdx)
      .add(1, 0);

    const id = crypto.randomUUID();
    const renderable = new TempWireRenderable(
      id, this.renderManager.renderState, fromPos
    );

    this.interactionState.tempWire = {
      fromId,
      fromIdx,
      renderable
    };

    renderable.setPath([fromPos]);
  }

  private startElementDrag(id: string, offset: Vector2) {
    const pos = this.renderManager.getPositionOfElement(id);
    if (!pos) return;
    this.interactionState.draggingElement = {
      startingPos: pos,
      renderableId: id
    }

    Chip.gridElementFollowsMouse(this.chip, this.renderManager, id, offset);
  }

  private posIsOnInputBtn(id: string, position: Vector2): boolean {
    const radius = this.renderManager.getIndicatorRadiusOfElement(id);
    const elementPos = this.renderManager.getPositionOfElement(id);

    const bb: BoundingBox = {
      left: elementPos.x + 1.5 - radius,
      right: elementPos.x + 1.5 + radius,
      top: elementPos.y + 1.5 - radius,
      bottom: elementPos.y + 1.5 + radius,
    }

    return (
      position.x > bb.left   &&
      position.x < bb.right  &&
      position.y > bb.top    &&
      position.y < bb.bottom
    )
  }

  private updateTempWire(mouseCell: Vector2) {
    const onElement = this.interactionState.onElement;

    // check if we are next to or on an input pin
    const elementToTheLeft = this.chip.cellHasElement(mouseCell.subtract(1, 0));
    const elementToTheRight = this.chip.cellHasElement(mouseCell.add(1, 0));

    // the id of the element that we are to the left of.
    // undefined if there isn't one
    let onLeftOfElement: string;
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
      const cellsFromTop = mouseCell.y - elementPos.y;
      const inputAtPosition = this.renderManager.inputPinAtPos(
        onLeftOfElement, cellsFromTop
      );

      // if there is an input pin, and it hasn't already been used activate it
      if (
        inputAtPosition !== -1 &&
        !this.chip.isInputTaken(onLeftOfElement, inputAtPosition)
      ) {
        this.interactionState.activeInputPin = {
          nodeId: onLeftOfElement,
          inputIdx: inputAtPosition
        }

        const newEndpoint = this.renderManager.getPosOfInputPin(onLeftOfElement, inputAtPosition)
          .subtract(1, 0);


        this.updateTempWirePath(
          this.interactionState.tempWire.renderable,
          newEndpoint,
          true
        );
      }
    }
    else { // if we arent next to or on an input pin
      this.interactionState.activeInputPin = undefined;
    }
  }
}