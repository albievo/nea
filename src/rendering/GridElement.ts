import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
import { TruthtableBehaviour } from "../netlist/ChipBehaviour";
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

  protected _kind: RenderableKind = 'grid-element';
  protected renderBuffer: GridElementRenderBuffer = { kind: 'grid-element' };

  private lastValidPosition: Vector2;
  private lastMouseCell: Vector2 = Vector2.zeroes;

  private colour?: string;

  constructor(
    id: string,
    renderManager: RenderManager,
    pos: Vector2, dims: Vector2,
  ) {
    super(id, renderManager);

    this.dims = dims.fixedCopy();
    this.pos = pos.copy();

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