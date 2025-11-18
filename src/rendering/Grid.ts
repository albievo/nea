import { Vector2 } from "../utils/Vector2";
import { WebpageUtils } from "../utils/WebpageUtils";
import { Renderable } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { AnyRenderPayload, InitialGridRenderPayload } from "./RenderPayloads";
import $ from 'jquery';

export class Grid extends Renderable {
  protected $HTMLElem?: JQuery<HTMLElement>;
  private ctx!: CanvasRenderingContext2D;

  private devicePixelRatio = WebpageUtils.calculateDevicePixelRatio();

  private height!: number;
  private width!: number;

  private canvasDimsPixels!: Vector2;

  private offset = new Vector2(0, 0);

  private zoom: number = 1;
  private zoomCoeff!: number;
  
  private cellDimAtMinZoom!: number;

  private maxZoom!: number;
  private minZoom!: number;
  
  constructor(id: string, renderManager: RenderManager) {
    super(id, renderManager);
  }

  render(payload: AnyRenderPayload): void {
    if (payload.kind === "initial-grid-render")  {
      this.initialRender(payload);
    }
  }

  private initialRender(payload: InitialGridRenderPayload): void {
    this.$HTMLElem = $('<canvas class="grid"></canvas>');
    $('#canvas-wrapper').append(this.$HTMLElem);

    this.height = payload.height;
    this.width = payload.width;

    this.zoom = payload.startingZoom;
    this.maxZoom = payload.maxZoom;
    this.zoomCoeff = payload.zoomCoefficient;

    this.cellDimAtMinZoom = this.calcCellDimAtMinZoom();

    this.canvasDimsPixels = this.calcCanvasDimsPixels();

    const currentlyVisible = this.calcCellsVisible();

    this.setOffset(new Vector2(
      this.width - currentlyVisible.getX(),
      this.height - currentlyVisible.getY()
    ));

    this.setCtx();
    this.configureHTMLElem();
  }

  private calcCellDimAtMinZoom() {
    if (!this.$HTMLElem) {
      throw new Error('please perform an initial render before calculating cell size.');
    }

    return Math.max(
      this.devicePixelRatio * this.$HTMLElem.height()! / this.height,
      this.devicePixelRatio * this.$HTMLElem.width()! / this.width
    );
  }

  private configureHTMLElem() {
    this.$HTMLElem!.width(this.canvasDimsPixels.getX());
    this.$HTMLElem!.height(this.canvasDimsPixels.getY());
  }

  private calcCellsVisible() {
    const cellDim = this.calcCellDim()

    return new Vector2(
      this.canvasDimsPixels.getX() / cellDim,
      this.canvasDimsPixels.getY() / cellDim
    )
  }

  private calcCanvasDimsPixels(): Vector2 {
    return new Vector2(
      this.$HTMLElem?.height()! * this.devicePixelRatio,
      this.$HTMLElem?.width()! * this.devicePixelRatio
    )
  }

  private calcCellDim() {
    return this.cellDimAtMinZoom * this.zoom;
  }

  private setOffset(offset: Vector2) {
    const currentlyVisible = this.calcCellsVisible();
    const maxXOffset = Math.max(0, this.width - currentlyVisible.getX());
    const maxYOffset = Math.max(0, this.height - currentlyVisible.getY());

    this.offset = new Vector2(
      Math.max(0, Math.min(offset.getX(), maxXOffset)),
      Math.max(0, Math.min(offset.getY(), maxYOffset))
    )
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

    ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    this.ctx = ctx;
  }

  private renderGrid() {
    const ctx = this.ctx;

    //clear the canvas
    ctx.clearRect(0, 0, this.canvasDimsPixels.getX(), this.canvasDimsPixels.getY());

    // no offset yet
    const cellDim = this.calcCellDim();

    const linesToDraw = this.calcCellsVisible().add(1);

    const offset = this.offset.applyFunction(n => (n % 1) * cellDim);

    //draw rows
    ctx.beginPath();
    for (let row = 0; row < linesToDraw.getX(); row++) {
      const rowY = row * cellDim - offset.getX();

      ctx.moveTo(0, rowY);
      ctx.lineTo(this.canvasDimsPixels.getX(), rowY);
    }

    //draw columns
    for (let col: number = 0; col < linesToDraw.getY(); col++) {
      const colX = col * cellDim - offset.getY();

      ctx.moveTo(colX, 0);
      ctx.lineTo(colX, this.canvasDimsPixels.getY());
    }
    
    ctx.stroke();
  }
}