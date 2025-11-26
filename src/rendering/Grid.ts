import { Vector2 } from "../utils/Vector2";
import { WebpageUtils } from "../utils/WebpageUtils";
import { Renderable } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { GridPayload, InitialGridRenderPayload, ZoomPayload } from "./RenderPayloads";
import $ from 'jquery';

export class Grid extends Renderable {
  protected $HTMLElem?: JQuery<HTMLElement>;
  private ctx!: CanvasRenderingContext2D;

  private devicePixelRatio = WebpageUtils.calculateDevicePixelRatio();

  private lastMousePos = new Vector2(0, 0);

  private height!: number;
  private width!: number;

  private canvasDimsPixels!: Vector2;

  // measured in cells
  private offset = new Vector2(0, 0);

  private zoom: number = 1;
  private zoomCoeff!: number;
  
  private cellDimAtMinZoom!: number;

  private maxZoom!: number;
  private minZoom: number = 1;
  
  constructor(id: string, renderManager: RenderManager) {
    super(id, renderManager);
  }

  public render(payload: GridPayload): void {
    if (payload.initial) {
      this.initialRender(payload.initial);
    }

    if (payload.movement) {
      this.move(payload.movement);
    }
    
    if (payload.zoom) {
      this.zoomBy(payload.zoom);
    }

    this.renderGrid();
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
      (this.width - currentlyVisible.getX()) / 2,
      (this.height - currentlyVisible.getY()) / 2
    ));

    this.setCtx();
    this.configureHTMLElem();

    this.$HTMLElem.on('mousedown', e => this.handleMouseDown(e));
    this.$HTMLElem.on('wheel', e => this.handleWheel(e));
  }

  private move(delta: Vector2) {
    const cellDim = this.calcCellDim();

    const deltaInCells = delta.divide(cellDim);

    const newOffset = this.offset
      .subtract(deltaInCells);

    this.setOffset(newOffset);
  }

  private zoomBy(payload: ZoomPayload) {
    const oldCellDim = this.calcCellDim();

    const oldMousePosCells = payload.mousePos.divide(oldCellDim);

    // cell co-ords before zoom
    const originalCellCoords = this.offset.add(oldMousePosCells);

    const rawZoom = this.zoom + payload.delta;
    const boundedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, rawZoom));

    const newCellDim = this.cellDimAtMinZoom * boundedZoom;

    const newMousePosCells = payload.mousePos.divide(newCellDim);

    this.setOffset(originalCellCoords.subtract(newMousePosCells));

    console.log(this.zoom, boundedZoom);

    this.zoom = boundedZoom;
  }

  private handleMouseDown(event: JQuery.MouseDownEvent) {
    this.lastMousePos = new Vector2(
      event.clientX * this.devicePixelRatio,
      event.clientY * this.devicePixelRatio
    );

    this.followMouse();
    
    this.$HTMLElem?.on('mouseup', () => this.stopFollowingMouse());
  }

  private handleWheel(event: JQuery.TriggeredEvent) {
    const DOMEvent = event.originalEvent as WheelEvent;

    const mousePos = new Vector2(
      DOMEvent.clientX * this.devicePixelRatio,
      DOMEvent.clientY * this.devicePixelRatio
    )

    this.renderManager.requestRender(this.id, {zoom: {
      mousePos: mousePos,
      delta: DOMEvent.deltaY * this.zoomCoeff
    }});
  }

  private followMouse() {
    $(document).on('mousemove.followMouse', e => {
      if (!(e.clientX && e.clientY)) {
        return;
      }
      
      const newPos = new Vector2 (e.clientX, e.clientY).mult(this.devicePixelRatio);
      const delta = newPos.subtract(this.lastMousePos);

      this.lastMousePos = newPos;

      this.renderManager.requestRender(this.id, {movement: delta});
    })

    this.setPointer('grabbing');
  }

  private stopFollowingMouse() {
    $(document).off('mousemove.followMouse');

    this.setPointer('grab');
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
    const canvas = this.$HTMLElem![0] as HTMLCanvasElement;

    // IMPORTANT: set the canvas internal pixel buffer to match devicePixelRatio
    canvas.width = this.canvasDimsPixels.getX();
    canvas.height = this.canvasDimsPixels.getY();
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
      this.$HTMLElem?.width()! * this.devicePixelRatio,
      this.$HTMLElem?.height()! * this.devicePixelRatio
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

    ctx.beginPath();

    //draw rows
    for (let row = 0; row < linesToDraw.getY(); row++) {
      const rowY = row * cellDim - offset.getY();

      ctx.moveTo(0, rowY);
      ctx.lineTo(this.canvasDimsPixels.getX(), rowY);
    }

    //draw columns
    for (let col: number = 0; col < linesToDraw.getX(); col++) {
      const colX = col * cellDim - offset.getX();

      ctx.moveTo(colX, 0);
      ctx.lineTo(colX, this.canvasDimsPixels.getY());
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