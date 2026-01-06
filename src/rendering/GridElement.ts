import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
import { TruthtableBehaviour } from "../netlist/ChipBehaviour";
import { GeneralUtils } from "../utils/GeneralUtils";
import { MathUtils } from "../utils/MathUtils";
import { Vector2 } from "../utils/Vector2";
import keyTracker from "./KeyTracker";
import { BoundingBox, Renderable, RenderableKind } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { GridElementRenderBuffer, InitialGridElementPayload, RenderBufferUtils } from "./RenderBuffers";
import $ from 'jquery';
import { TempWire } from "./wires/TempWire";
import { PermWire } from "./wires/PermWire";
import { isGridElement } from "./RenderableTypeGuards";

export class GridElement extends Renderable<'grid-element'> {
  protected _kind = 'grid-element' as const;
  protected renderBuffer: GridElementRenderBuffer = { kind: 'grid-element' };

  // in world units
  private dims: Vector2;
  private pos: Vector2;

  private inputs: number;
  private outputs: number;

  // -1 means no pin, any other number is the index of the pin
  private inputPositions!: number[];
  private outputPositions!: number[];

  private readonly PIN_RADIUS = 0.3;

  private mouseOnPin: number = -1;
  private activeInput: number = -1;

  private lastValidPosition: Vector2;

  private colour?: string;

  constructor(details: GridElementDetails) {
    super(details.id, details.renderManager);
    
    this.inputs = details.inputs;
    this.outputs = details.outputs;

    let yDim: number;
    if ( // hard coded to mske common configurations look nicer
      this.inputs === 2 && this.outputs === 1 ||
      this.inputs === 1 && this.outputs === 2
    ) {
      yDim = 3
    }
    else {
      yDim = Math.max(this.inputs, this.outputs)
    }

    this.dims = new Vector2(
      details.width,
      yDim
    );

    // make position arrays
    this.calcPinPositions();

    this.pos = details.startingPos.copy();
    this.lastValidPosition = this.pos.copy();
  }

  protected getEventHandlers(): EventHandlerMap {
    return {
      ...this.baseEventHandlers,
      'mouse-moved-into-element': this.handleMouseMovedOntoElement.bind(this),
      'mouse-moved-off-element': this.handleMouseMovedOffElement.bind(this),
      'temp-wire-path-updated': this.handleTempWirePathUpdated.bind(this),
    }
  };

  protected updateFromBuffer(): void {
    if (this.renderBuffer.initial) this.initialRender(this.renderBuffer.initial);
    this.activeInput = this.renderBuffer.activation ?? -1;
  }

  protected getBoundingBox(): BoundingBox {
    return {
      top: this.pos.y,
      left: this.pos.x,
      right: this.pos.x + this.dims.x,
      bottom: this.pos.y + this.dims.y
    }
  }

  private initialRender(payload: InitialGridElementPayload) {
    this.colour = payload.color;

    //add availability
    for (let x = 0; x < this.dims.x; x++) {
      for (let y = 0; y < this.dims.y; y++) {
        this.renderManager.addElementToCell(
          this.pos.add(new Vector2(x, y)),
          this.id
        ); 
      }
    }
  }

  private calcPinPositions() {
    // hard coded as small so making symmetrical is ok
    if (this.inputs === 1 && this.outputs === 2) {
      this.inputPositions = [-1, 0, -1];
      this.outputPositions = [0, -1, 1];
    }
    else if (this.inputs === 2 && this.outputs === 1) {
      this.inputPositions = [0, -1, 1];
      this.outputPositions = [-1, 0, -1];
    }

    // for most cases, place pins as centrally as possible
    else { 
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
  }

  protected renderObject() {
    // ensure camera exists    
    const camera = this.renderManager.camera

    const ctx = this.renderManager.ctx;

    const screenPos = camera.worldPosToScreen(this.pos);
    const screenDims = this.dims.applyFunction((n) => camera.worldUnitsToScreenPixels(n));

    // draw the element
    ctx.fillStyle = this.colour || 'grey';
    ctx.fillRect(
      screenPos.x,
      screenPos.y,
      screenDims.x,
      screenDims.y
    );

    // calculate screen radius of pins
    const radiusScreen = camera.worldUnitsToScreenPixels(this.PIN_RADIUS);

    for (let pinIdx = 0; pinIdx < this.dims.y; pinIdx++) {
      const yPos = this.pos.y + pinIdx + 0.5;

      const inputIdx = this.inputPositions[pinIdx]
      // draw the inputs
      if (inputIdx !== -1) { // if we should render a pin here\
        const active = inputIdx === this.activeInput;

        const centreWorld = new Vector2(this.pos.x, yPos)
        const centreScreen = camera.worldPosToScreen(centreWorld);
        this.renderInputPin(centreScreen, radiusScreen, active);
      }

      const outputIdx = this.outputPositions[pinIdx]
      // draw trhe ouputs 
      if (outputIdx !== -1) { // if we should render a pin here
        const xPos = this.pos.x + this.dims.x
        const centreWorld = new Vector2(xPos, yPos);
        const centreScreen = camera.worldPosToScreen(centreWorld);
        this.renderOutputPin(centreScreen, radiusScreen);
      }
    }
  }

  private renderInputPin(centre: Vector2, radius: number, active: boolean) {
    const ctx = this.renderManager.ctx;

    ctx.beginPath();
    ctx.arc(
      centre.x, centre.y,
      radius,
      -Math.PI / 2, Math.PI / 2
    )

    ctx.fillStyle = active ? 'lightgreen' : 'lightblue';
    ctx.fill();
  }

  private renderOutputPin(centre: Vector2, radius: number) {
    const ctx = this.renderManager.ctx;

    ctx.beginPath();
    ctx.arc(
      centre.x + 1, centre.y,
      radius,
      Math.PI / 2,
      Math.PI * 3/2
    )

    ctx.fillStyle = 'lightblue';
    ctx.fill();
  }

  private handleMouseMovedOntoElement(details: { elementId: string }) {
    // check whether it is over this element
    if (!(details.elementId === this.id)) {
      return;
    }

    // add listener for mouse moving
    $(document).on('mousemove.mousemoveOnElement', (mouseMove: JQuery.MouseMoveEvent) => {
      const mousePos = this.renderManager.camera.getWorldPosFromJqueryMouseEvent(mouseMove);

      if (this.mouseOnPin === -1) { // if we arent currently on a pin, check if we are now

        // iterate through potential pin positions
        for (let posIdx = 0; posIdx < this.dims.y; posIdx++) {

          // if there is an output pin here
          const pinAtPos = this.outputPositions[posIdx]
          if (pinAtPos !== -1) {
            // check whether we are in the pin
            const onOutputPin = this.isMouseOnOutputPin(mousePos, posIdx);
            if (onOutputPin) {
              this.mouseOnPin = pinAtPos;
            }
          }
        }
      }
      else { // if we are currently on a pin, check if we are still
        // get the position of the pin we should be on
        const posIdx = this.getOutputPosIdx(this.mouseOnPin);
        // check if were on it
        const onOutputPin = this.isMouseOnOutputPin(mousePos, posIdx);
        // if not, make mouse on pin correct
        if (!onOutputPin) this.mouseOnPin = -1;
      }
    });

    // add listener for clicking
    $(document).on('mousedown.mousedownOnElement', (mousedown: JQuery.MouseDownEvent) => {
      // if we should be panning, dont do anything
      if (keyTracker.space) return; 

      // if the mouse is on a pin, attach a wire
      if (this.mouseOnPin !== -1) {
        this.attachTempWire(this.mouseOnPin);
      }
      // otherwise, drag the element
      else {
        // get mouse positions
        const worldPos = this.renderManager.camera.getWorldPosFromJqueryMouseEvent(mousedown);
        const cell = worldPos.applyFunction(Math.floor); 

        // calculate offset
        const offset = cell.subtract(this.pos);

        // follow mouse
        this.followMouse(offset);

        $(document).on('mouseup.stopFollowingMouse', () => this.stopFollowingMouse());
      } 
    })
  }

  private handleMouseMovedOffElement() {
    $(document).off('mousemove.mousemoveOnElement');
    $(document).off('mousedown.mousedownOnElement');
  }

  protected handleTempWirePathUpdated(details: { endCell: Vector2 }) {
    for (let inputPosIdx = 0; inputPosIdx < this.inputPositions.length; inputPosIdx++) {
      const inputIdx = this.inputPositions[inputPosIdx];
      if (inputIdx === -1) {
        continue;
      }

      const inputPos = this.pos.add(0, inputPosIdx);

      if (
        details.endCell.equals(inputPos) ||
        details.endCell.add(1, 0).equals(inputPos)
      ) {
        this.activateInputPos(inputIdx);
        return;
      }
    }

    this.deactivateInputs();
  }

  /**
   * @param mousePos mouse position in world units
   * @param pinIdx the position of the pin in the array outputPositions
   */
  private isMouseOnOutputPin(mousePos: Vector2, posIdx: number): boolean {
    // calculate the distance from the mouse to the pin
    const outputDistFromTop = posIdx + 0.5;
    const outputPos = this.pos.add(new Vector2(this.dims.x, outputDistFromTop))
    const distToMouse = MathUtils.calcDistBetweenPoints(mousePos, outputPos);

    return distToMouse <= this.PIN_RADIUS && mousePos.x <= outputPos.x
  }

  private stopFollowingMouse() {
    events.off('mouse-changed-cell', 'draggingListener');
    $(document).off('mouseup.stopFollowingMouse');
  }

  // offset is represents the vector from the top left of the element to the top left of the cell clicked in 
  // hence it is an integer vector
  private followMouse(offset: Vector2) {
    events.on('mouse-changed-cell', (event) => {
      let cell = event.to.subtract(offset);

      //updating taken cells is done seperately in case new cells overlap with old ones
      //might be able to be done more efficiently but we arent gonna have to do much iteration
      // free up old cells
      for (let x = 0; x < this.dims.x; x++) {
        for (let y = 0; y < this.dims.y; y++) {
          this.renderManager.rmvElementFromCell(
            this.pos.add(new Vector2(x, y))
          ); 
        }
      }

      // ensure not moving to a taken cell
      if (!this.isValidPosition(cell)) {
        cell = this.lastValidPosition.copy();
      } else {
        this.lastValidPosition = cell.copy();
      }

      // calculate movement
      const delta = cell.subtract(this.pos);

      this.pos = cell.copy();

      if (!delta.equals(Vector2.zeroes)) {
        events.emit('grid-element-moved', { id: this.id });
      }

      // send render request
      this.appendRenderBuffer({ movement: true });

      // add new cell positions
      for (let x = 0; x < this.dims.x; x++) {
        for (let y = 0; y < this.dims.y; y++) {
          this.renderManager.addElementToCell(
            cell.add(new Vector2(x, y)), this.id
          );
        }
      }
      this.pos = cell.copy();
    }, 'draggingListener');
  }

  private isValidPosition(pos: Vector2): boolean {
    const worldSize = this.renderManager.getWorldSize()

    // ensure it is being moved to within the world
    if ( 
      pos.x <= 0 ||
      pos.y <= 0 ||
      pos.x + this.dims.x >= worldSize.x  ||
      pos.y + this.dims.y >= worldSize.y
    ) {
      return false; 
    }

    const width = this.dims.x;
    const height = this.dims.y;

    // adding constants should give the element being moved a "forcefield" of width 1
    const boundingBox: BoundingBox = {
      left: pos.x - 1,
      right: pos.x + width + 1,
      top: pos.y - 1,
      bottom: pos.y + height + 1
    }

    // iterate throught each cell to check
    for (let x = boundingBox.left; x < boundingBox.right; x++) {
      for (let y = boundingBox.top; y < boundingBox.bottom; y++) {
        const checkingPos = new Vector2(x, y);

        if (this.renderManager.cellHasElement(checkingPos)) {
          return false;
        }
      }
    }

    return true;
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

  public getOutputPos(pinIdx: number): Vector2 {
    const outputPosIdx = this.getOutputPosIdx(pinIdx);

    const outputCell = this.pos.add(new Vector2(
      this.dims.x - 1,
      outputPosIdx
    ));

    return outputCell;
  }

  public getInputPos(pinIdx: number): Vector2 {
    const inputPosIdx = this.getInputPosIdx(pinIdx);

    const inputCell = this.pos.add(new Vector2(
      0,
      inputPosIdx
    ));

    return inputCell;
  }

  private attachTempWire(outputIdx: number) {
    const tempWireId = crypto.randomUUID();
    const tempWire = new TempWire(
      tempWireId, this.renderManager,
      this.id, this, outputIdx
    );

    this.renderManager.addRenderable(tempWire);

    tempWire.appendRenderBuffer({ initial: true });
  }

  private attachPermWire(
    fromId: string, fromPin: number,
    toPin: number
  ) {
    console.log(`attatching perm wire from ${fromId}, ${fromPin} to ${this.id}, ${toPin}`);

    const fromElement = this.renderManager.getRenderableWithId(fromId);
    if (!fromElement || !isGridElement(fromElement)) {
      return;
    }

    const wire = new PermWire(
      crypto.randomUUID(), this.renderManager,
      fromId, fromElement, fromPin,
      this.id, this, toPin
    )

    this.renderManager.addRenderable(wire);
  }

  private activateInputPos(inputIdx: number) {
    this.appendRenderBuffer({ activation: inputIdx });

    console.log(`activating input ${inputIdx} of ${this.id}`);

    events.on('temp-wire-released', (
      details: { fromElement: string, fromOutput: number }
    ) => {
      console.log('temp wire released');

      this.attachPermWire(
        details.fromElement, details.fromOutput,
        inputIdx
      );

      this.deactivateInputs();
    }, `make-perm-wire-to-${this.id}`);
  }

  private deactivateInputs() {
    console.log(`deactivating inputs of element with id ${this.id}`);

    this.activeInput = -1;
    events.off('temp-wire-released', `make-perm-wire-to-${this.id}`);
  }

  protected resetRenderBuffer(): void {
    this.renderBuffer = { kind: 'grid-element' }
  }

  protected mergeRenderBuffers(
    original: GridElementRenderBuffer,
    toAdd: GridElementRenderBuffer
  ): GridElementRenderBuffer {

    const mergedOriginal = RenderBufferUtils.mergeGenericProperties(
      original, toAdd
    )

    // don't merge initials
    if (original.initial && toAdd.initial) {
      console.error('cannot merge 2 initial renders');
      mergedOriginal.initial = original.initial;
    }
    else {
      mergedOriginal.initial = original.initial || toAdd.initial;
    }

    // if either move, there has been movement
    mergedOriginal.movement = original.movement || toAdd.movement

    mergedOriginal.activation =
      toAdd.activation ?? original.activation;
    
    return mergedOriginal;
  }
}

interface GridElementDetails {
  id: string,
  renderManager: RenderManager,
  startingPos: Vector2,
  inputs: number,
  outputs: number,
  width: number // measured in world units
}