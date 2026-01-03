import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
import { BoundingBox, Renderable, RenderableKind } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { GridRenderBuffer, InitialGridRenderPayload, RenderPayloadUtils } from "./RenderPayloads";
import $ from 'jquery';

export class Grid extends Renderable<'grid'> {
  private ctx: CanvasRenderingContext2D;

  private height!: number;
  private width!: number;

  protected _kind = 'grid' as const;
  protected renderBuffer: GridRenderBuffer = { kind: 'grid' };
  
  constructor(id: string, renderManager: RenderManager) {
    super(id, renderManager);

    this.ctx = this.renderManager.ctx;
  }

  protected updateFromBuffer(): void {
    // could be cleaned up with a renderHandler record, but I like the readability here
    if (this.renderBuffer.initial) this.initialRender(this.renderBuffer.initial);
  }

  protected getBoundingBox(): BoundingBox {
    return {
      top: 0,
      left: 0,
      right: this.width + 1,
      bottom: this.height + 1 
    }
  }

  private initialRender(payload: InitialGridRenderPayload): void {
    // set relevant values
    this.height = payload.size.y;
    this.width = payload.size.x;
  }

  protected getEventHandlers(): EventHandlerMap {
    return {
      ...this.baseEventHandlers
    }
  }

  protected renderObject() {
    const camera = this.renderManager.camera

    const ctx = this.ctx;

    const windowDims = camera.getWindowDims();
    
    const cellDimScreen = camera.worldUnitsToScreenPixels(1);

    const linesToDraw = camera.calcWorldUnitsOnScreen().add(1);

    // calculate offset
    const offsetWorld = camera.getPan().applyFunction(n => n % 1);
    const offsetScreen = offsetWorld.applyFunction(n => camera.worldUnitsToScreenPixels(n));
    
    ctx.beginPath();

    //draw rows
    for (let row = 0; row < linesToDraw.y; row++) {
      const rowY = row * cellDimScreen - offsetScreen.y;

      ctx.moveTo(0, rowY);
      ctx.lineTo(windowDims.x, rowY);
    }

    //draw columns
    for (let col: number = 0; col < linesToDraw.x; col++) {
      const colX = col * cellDimScreen - offsetScreen.x;

      ctx.moveTo(colX, 0);
      ctx.lineTo(colX, windowDims.y);
    }
    
    ctx.stroke();
  }

  protected mergeRenderBuffers(
    original: GridRenderBuffer,
    toAdd: GridRenderBuffer
  ): GridRenderBuffer {

    const mergedOriginal = RenderPayloadUtils.mergeGenericProperties(
      original, toAdd
    )

    // don't merge initials
    if (original.initial && toAdd.initial) {
      console.error('cannot merge 2 initial renders');
      mergedOriginal.initial = original.initial;
    }

    return mergedOriginal;
  }

  protected resetRenderBuffer(): void {
    this.renderBuffer = { kind: 'grid' }
  }
}