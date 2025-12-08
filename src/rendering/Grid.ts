import { GeneralUtils } from "../utils/GeneralUtils";
import { Vector2 } from "../utils/Vector2";
import { WebpageUtils } from "../utils/WebpageUtils";
import { Camera } from "./Camera";
import { Renderable } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { GridPayload, InitialGridRenderPayload, ZoomPayload } from "./RenderPayloads";
import $ from 'jquery';

export class Grid extends Renderable {
  protected $HTMLElem?: JQuery<HTMLElement>;
  private ctx!: CanvasRenderingContext2D;

  private height!: number;
  private width!: number;
    
  constructor(id: string, renderManager: RenderManager) {
    super(id, renderManager);
  }

  public render(payload: GridPayload): void {
    // could be cleaned up with a renderHandler record, but I like the readability here
    if (payload.initial) this.initialRender(payload.initial);
    if (payload.camera) this.updateForCamera();
    if (payload.resize) this.fitToPage();

    this.renderGrid();
  }

  private initialRender(payload: InitialGridRenderPayload): void {
    // create HTML element
    this.$HTMLElem = $('<canvas class="grid"></canvas>');
    $('#canvas-wrapper').append(this.$HTMLElem);

    // set relevant values
    this.height = payload.size.getY();
    this.width = payload.size.getX();

    // set up canvas rendering context
    this.setCtx();
    // update values that care about the size of the page
    this.fitToPage();

    // attach listeners
    $(document).on('wheel', () => this.handleWheel());
    $(document).on('mousedown', () => this.handleMouseDown());
    $(window).on('resize', () => this.handleResize());
  }

  private updateForCamera() {
    this.renderGrid();
  }

  private fitToPage() {
    const camera = this.camera;
    if (!camera) {
      throw new Error("please supply a camera");
    }

    const windowDims = camera.getWindowDims();

    this.ctx.canvas.width = windowDims.getX();
    this.ctx.canvas.height = windowDims.getY();
  }

  private handleWheel() {
    this.renderManager.requestRender(this.id, {camera: true});
  }

  private handleResize() {
    this.renderManager.requestRender(this.id, {resize: true});
  }

  private handleMouseDown() {
    this.setPointer('grabbing');

    $(document).on(
      'mousemove.followMouse', () => this.handleDragged()
    );
    $(document).on(
      'mouseup.stopFollowingMouse', () => this.stopFollowingMouse()
    );
  }

  private handleDragged() {
    this.renderManager.requestRender(this.id, {camera: true});
  }

  private stopFollowingMouse() {
    $(document).off('mousemove.followMouse');
    $(document).off('mouseup.stopFollowingMouse');
    this.setPointer('default');
  }

  private setCtx() {
    const canvas = this.$HTMLElem?.[0];
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("browser cannot use canvas element")
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Couldn't get 2d context of canvas htmlElement");
    }

    const dpr = this.renderManager.getDevicePixelRatio()

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx = ctx;
  }

  private renderGrid() {
    const camera = this.camera;
    if (!camera) {
      throw new Error("please supply a camera");
    }

    const ctx = this.ctx;

    const windowDims = camera.getWindowDims();

    //clear the canvas
    ctx.clearRect(0, 0, windowDims.getX(), windowDims.getY());
    
    const cellDimScreen = camera.worldUnitsToScreenPixels(1);

    const linesToDraw = camera.calcWorldUnitsOnScreen().add(1);

    console.log(linesToDraw);

    // calculate offset
    const offsetWorld = camera.getPan().applyFunction(n => n % 1);
    const offsetScreen = offsetWorld.applyFunction(n => camera.worldUnitsToScreenPixels(n));
    
    ctx.beginPath();

    //draw rows
    for (let row = 0; row < linesToDraw.getY(); row++) {
      const rowY = row * cellDimScreen - offsetScreen.getY();

      ctx.moveTo(0, rowY);
      ctx.lineTo(windowDims.getX(), rowY);
    }

    //draw columns
    for (let col: number = 0; col < linesToDraw.getX(); col++) {
      const colX = col * cellDimScreen - offsetScreen.getX();

      ctx.moveTo(colX, 0);
      ctx.lineTo(colX, windowDims.getY());
    }
    
    ctx.stroke();
  }

  public setPointer(pointerStyle: string) {
    if (pointerStyle === "default") {
      this.$HTMLElem?.css("cursor", "grab");
    } else {
      this.$HTMLElem?.css("cursor", pointerStyle);
    }
  }
}

interface CellTakenBy {
  type?: 'wire' | 'node',
  ids?: string[]
}