import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
import { TruthtableBehaviour } from "../netlist/ChipBehaviour";
import { GeneralUtils } from "../utils/GeneralUtils";
import { Vector2 } from "../utils/Vector2";
import keyTracker from "./KeyTracker";
import { BoundingBox, Renderable, RenderableKind } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { GridElementRenderBuffer, InitialGridElementPayload } from "./RenderPayloads";
import $ from 'jquery';

export class GridElement extends Renderable {
  // in world units
  private dims: Vector2;
  private pos: Vector2;

  private inputs: number;
  private outputs: number;

  private inputPositions: boolean[];
  private outputPositions: boolean[];

  private readonly PIN_RADIUS = 0.3;

  protected _kind: RenderableKind = 'grid-element';
  protected renderBuffer: GridElementRenderBuffer = { kind: 'grid-element' };

  private lastValidPosition: Vector2;
  private lastMouseCell: Vector2 = Vector2.zeroes;

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
      Math.max(this.inputs, this.outputs)
    );
    // make position arrays
    this.inputPositions = new Array(this.dims.y).fill(false);
    this.outputPositions = new Array (this.dims.y).fill(false);
    // make position arrays have the right values
    this.calcInputOutputPositions();

    this.pos = details.startingPos.copy();
    this.lastValidPosition = this.pos.copy();

    $(document).on('mousedown', e => this.handleMouseDown(e));
  }

  protected updateFromBuffer(): void {
    if (this.renderBuffer.initial) this.initialRender(this.renderBuffer.initial);
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

    $(document).on('mousedown', (e) => this.handleMouseDown(e));
  }

  private calcInputOutputPositions() {
    // hard coded as small so making symmetrical is ok
    if (this.inputs === 1 && this.outputs === 2) {
      this.inputPositions = [false, true, false];
      this.outputPositions = [true, false, true];
    }
    else if (this.inputs === 2 && this.outputs === 1) {
      this.inputPositions = [true, false, true];
      this.outputPositions = [false, true, false];
    }
    // for most cases, place pins as centrally as possible
    else { 
      if (this.inputs > this.outputs) {
        this.inputPositions = new Array (this.dims.y).fill(true);
        const topPadding = Math.floor((this.inputs - this.outputs) / 2);
        this.outputPositions.fill(true, topPadding, topPadding + this.outputs + 1);
      }
      else {
        this.outputPositions = new Array (this.dims.y).fill(true);
        const topPadding = Math.floor((this.outputs - this.inputs) / 2)
        this.inputPositions.fill(true, topPadding, topPadding + this.inputs + 1);
      }
    }
  }

  protected renderObject() {
    // ensure camera exists    
    const camera = this.camera
    if (!camera) {
      throw new Error ('please set a camera before rendering');
    }

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

    // draw the inputs
    for (let inputPos = 0; inputPos < this.inputs; inputPos++) {
      if (this.inputPositions[inputPos]) { // if we should render a pin here
        const centreWorld = new Vector2(
          this.pos.x,
          this.pos.y + inputPos + 0.5
        )
        const centreScreen = camera.worldPosToScreen(centreWorld);

        this.renderInputPin(centreScreen, radiusScreen);
      }
    }

    // draw the outputs
    for (let outputPos = 0; outputPos < this.outputs; outputPos++) {
      if (this.outputPositions[outputPos]) { // if we should render a pin here
        const centreWorld = new Vector2(
          this.pos.x + this.dims.x,
          this.pos.y + outputPos + 0.5
        )
        const centreScreen = camera.worldPosToScreen(centreWorld);

        this.renderOutputPin(centreScreen, radiusScreen);
      }
    }
  }

  private renderInputPin(centre: Vector2, radius: number) {
    const ctx = this.renderManager.ctx;

    ctx.beginPath();
    ctx.arc(
      centre.x, centre.y,
      radius,
      -Math.PI / 2, Math.PI / 2
    )

    ctx.fillStyle = 'lightblue';
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

  protected getEventHandlers(): EventHandlerMap {
    return {}
  };

  private handleMouseDown(event: JQuery.MouseDownEvent) {
    // ensure space isn't being pressed (in this case we pan)
    if (keyTracker.space) return;

    // ensure there is a camera
    const camera = this.camera;
    if (!camera) return;

    // get mouse positions
    const worldPos = camera.getWorldPosFromJqueryMouseEvent(event);
    const cell = worldPos.applyFunction(Math.floor); 

    // ensure we are clicking on the element
    if (!this.contains(worldPos)) return;

    const offset = cell.subtract(this.pos);
    this.lastMouseCell = cell.copy();
    this.followMouse(offset);

    $(document).on('mouseup.stopFollowingMouse', () => this.stopFollowingMouse());
  }

  private stopFollowingMouse() {
    $(document).off('mousemove.followMouse');
    $(document).off('mouseup.stopFollowingMouse');
  }

  private followMouse(offset: Vector2) {
    const dppr = this.renderManager.getDevicePixelRatio();
    const camera = this.camera;
    if (!camera) return;

    $(document).on('mousemove.followMouse', (e) => {
      const event = e as JQuery.MouseMoveEvent;

      const worldPos = camera.getWorldPosFromJqueryMouseEvent(event);
      const worldPosAfterOffset = worldPos.subtract(offset);
      // get the cell that the mouse is in
      let cell = worldPosAfterOffset.applyFunction(Math.floor);

      // if we haven't moved cell, end the method
      if (cell.equals(this.lastMouseCell)) return;

      this.lastMouseCell = cell.copy();

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

      // send render request
      this.renderManager.requestRender({
        gridElementsMovement: {
          [this.id]: { delta }
        }
      })

      // add new cell positions
      for (let x = 0; x < this.dims.x; x++) {
        for (let y = 0; y < this.dims.y; y++) {
          this.renderManager.addElementToCell(
            cell.add(new Vector2(x, y)), this.id
          );
        }
      }
      this.pos = cell.copy();
    });
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

  /**
   * Checks whether a world pos in within the bounds of this element
   */
  private contains(worldPos: Vector2): boolean {
    const bottomRight = this.calcBottomRight();

    const withinX = this.pos.x <= worldPos.x && worldPos.x <= (bottomRight.x);
    const withinY = this.pos.y <= worldPos.y && worldPos.y <= (bottomRight.y);

    return withinX && withinY;
  }

  private calcBottomRight() {
    return this.pos.add(this.dims);
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