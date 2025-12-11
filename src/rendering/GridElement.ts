import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { Renderable } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { GridElementPayload, InitialGridElementPayload } from "./RenderPayloads";
import $ from 'jquery';

export class GridElement extends Renderable {
  // in world units
  private dims: Vector2;
  private pos: Vector2;

  private colour?: string;

  constructor(
    id: string,
    renderManager: RenderManager,
    pos: Vector2, dims: Vector2,
  ) {
    super(id, renderManager);

    this.dims = dims.fixedCopy();
    this.pos = pos.copy();
  }

  public render(payload: GridElementPayload): void {
    if (payload.initial) this.initialRender(payload.initial);

    this.renderElement();
  }

  private initialRender(payload: InitialGridElementPayload) {
    this.colour = payload.color;
  }

  private renderElement() {
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

    const bottomRight = this.pos.add(this.dims);

    return camera.isOnScreen(this.pos) || camera.isOnScreen(bottomRight);
  }

  protected getEventHandlers(): EventHandlerMap {
    return {
      'pan': () => this.handlePan(),
      'zoom': () => this.handleZoom(),
      'resize': () => this.handleResize()
    };
  };

  private handlePan() {
    this.renderManager.requestRender(this.id, { kind: 'grid-element', camera: true });
  }

  private handleZoom() {
    this.renderManager.requestRender(this.id, { kind: 'grid-element', camera: true });
  }

  private handleResize() {
    this.renderManager.requestRender(this.id, { kind: 'grid-element', resize: true });
  }
}