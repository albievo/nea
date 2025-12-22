import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
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

  private colour?: string;

  constructor(
    id: string,
    renderManager: RenderManager,
    pos: Vector2, dims: Vector2,
  ) {
    super(id, renderManager);

    this.dims = dims.fixedCopy();
    this.pos = pos.copy();

    $(document).on('mousedown', e => this.handleMouseDown(e));
  }

  protected updateFromBuffer(): void {
    if (this.renderBuffer.initial) this.initialRender(this.renderBuffer.initial);
    if (this.renderBuffer.movement) this.move(this.renderBuffer.movement)
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

    $(document).on('mousedown', (e) => this.handleMouseDown(e));
  }

  private move(movement: Vector2) {
    this.pos = this.pos.add(movement);
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
    const dppr = this.renderManager.getDevicePixelRatio();

    // ensure space isn't being pressed (in this case we pan)
    if (keyTracker.space) return;

    // ensure there is a camera
    const camera = this.camera;
    if (!camera) return;

    // get mouse positions
    const screenPos = new Vector2(event.clientX * dppr, event.clientY * dppr);
    const worldPos = camera.screenToWorld(screenPos);
    const cell = worldPos.applyFunction(Math.floor);

    // ensure we are clicking on the element
    if (!this.contains(worldPos)) return;

    const offset = cell.subtract(this.pos);

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

    $(document).on('mousemove.followMouse', (event) => {
      if (!(event.clientX && event.clientY)) {
        return;
      }

      // get positions
      const screenPos = new Vector2(
        event.clientX * dppr,
        event.clientY * dppr
      );
      const worldPos = camera.screenToWorld(screenPos);

      const worldPosAfterOffset = worldPos.subtract(offset);

      // get the cell that the mouse is in
      const cell = worldPosAfterOffset.applyFunction(Math.floor);
      
      // if we have moved cell
      if (!cell.equals(this.pos)) {

        // calculate movement
        const delta = cell.subtract(this.pos);

        // send render request
        this.renderManager.requestRender({
          gridElementsMovement: {
            [this.id]: { delta }
          }
       })
      }
    });
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