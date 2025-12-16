import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { Renderable, RenderableKind } from "./Renderable";
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

  private initialRender(payload: InitialGridElementPayload) {
    this.colour = payload.color;
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
    
    //don't render unless on screen
    const isOnScreen = this.isOnScreen();
    if (!isOnScreen) {
      return;
    }

    const ctx = this.renderManager.ctx;

    const screenPos = camera.worldPosToScreen(this.pos);
    const screenDims = camera.worldUnitsToScreenPixels(this.dims.x);

    // draw the element
    ctx.fillStyle = this.colour || 'grey';
    ctx.fillRect(
      screenPos.x,
      screenPos.y,
      screenDims,
      screenDims
    );
  }

  private isOnScreen(): boolean {
    const camera = this.camera
    if (!camera) {
      throw new Error ('please set a camera to check if the element is on screen')
    }

    const bottomRight = this.calcBottomRight()

    return camera.isOnScreen(this.pos) || camera.isOnScreen(bottomRight);
  }

  protected getEventHandlers(): EventHandlerMap {
    return {}
  };

  private handleMouseDown(event: JQuery.MouseDownEvent) {

    const camera = this.camera;
    if (!camera) return;

    const screenPos = new Vector2(event.clientX, event.clientY);
    const worldPos = camera.screenToWorld(screenPos);

    if (!this.contains(worldPos)) return;
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