import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
import { Renderable } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { GridPayload, InitialGridRenderPayload, ZoomPayload } from "./RenderPayloads";
import $ from 'jquery';

export class Grid extends Renderable {
  private ctx: CanvasRenderingContext2D;

  private height!: number;
  private width!: number;
    
  constructor(id: string, renderManager: RenderManager) {
    super(id, renderManager);

    this.ctx = this.renderManager.ctx;
  }

  public render(payload: GridPayload): void {
    // could be cleaned up with a renderHandler record, but I like the readability here
    if (payload.initial) this.initialRender(payload.initial);
    if (payload.camera) this.updateForCamera();

    this.renderGrid();
  }

  private initialRender(payload: InitialGridRenderPayload): void {
    // set relevant values
    this.height = payload.size.y;
    this.width = payload.size.x;

    events.on('resize', () => this.handleResize());
  }

  private updateForCamera() {
    this.renderGrid();
  }

  private handleZoom() {
    this.renderManager.requestRender(this.id, {kind: "grid", camera: true});
  }

  private handleResize() {
    this.renderManager.requestRender(this.id, {kind: "grid", resize: true});
  }

  private handleBeginPan() {
    this.setPointer('grabbing');
  }

  private handlePan() {
    this.renderManager.requestRender(this.id, { kind: 'grid', camera: true });
  }

  private handleEndPan() {
    this.setPointer('default');
  }

  private renderGrid() {
    const camera = this.camera;
    if (!camera) {
      throw new Error("please supply a camera");
    }

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

  public setPointer(pointerStyle: string) {
    if (pointerStyle === "default") {
      this.$canvas?.css("cursor", "grab");
    } else {
      this.$canvas?.css("cursor", pointerStyle);
    }
  }

  protected getEventHandlers(): EventHandlerMap {
    return {
      'end-pan': () => this.handleEndPan(),
      'begin-pan': () => this.handleBeginPan(),
      'pan': () => this.handlePan(),
      'zoom': () => this.handleZoom(),
    }
  }
}

interface CellTakenBy {
  type?: 'wire' | 'node',
  ids?: string[]
}