import { Vector2 } from "../utils/Vector2";
import $ from 'jquery';

export class Camera {
  private zoom: number;
  private pan: Vector2; // top-left of screen in world units
  private dppr: number;

  private minZoom = 1;
  private maxZoom: number;
  private zoomCoeff: number;

  private worldSize: Vector2
  private windowDims!: Vector2;

  private lastMousePos = new Vector2(0, 0);

  readonly baseCellPixels = 48;

  constructor(
    zoom: number, pan: Vector2,
    dppr: number, maxZoom: number, zoomCoeff: number,
    worldSize: Vector2
  ) {
    this.zoom = zoom;
    this.pan = pan.copy();
    this.dppr = dppr;
    this.maxZoom = maxZoom;
    this.zoomCoeff = zoomCoeff;
    this.worldSize = worldSize;
    this.fitToScreen();

    $(document).on('wheel', e => this.handleWheel(e));
    $(document).on('mousedown', e => this.handleMouseDown(e));
    $(window).on('resize', () => this.handleResize());
  }

  private handleWheel(event: JQuery.TriggeredEvent) {
    const DOMEvent = event.originalEvent as WheelEvent;

    // mouse position in screen pixels
    const mouseScreen = new Vector2(DOMEvent.clientX * this.dppr, DOMEvent.clientY * this.dppr);
    const mouseWorld = this.screenToWorld(mouseScreen);

    // compute new zoom
    const rawZoom = this.zoom * (1 + DOMEvent.deltaY * this.zoomCoeff);
    this.zoom = this.boundZoom(rawZoom);

    // adjust pan to keep mouseWorld under cursor
    this.setPan(
      mouseWorld.subtract(mouseScreen.divide(this.zoom * this.baseCellPixels))
    );
  }

  private handleMouseDown(event: JQuery.MouseDownEvent) {
    this.lastMousePos = new Vector2(
      event.clientX * this.dppr,
      event.clientY * this.dppr
    );

    this.followMouse();
    $(document).on('mouseup.stopFollowingMouse', () => this.stopFollowingMouse());
  }

  private followMouse() {
    $(document).on('mousemove.followMouse', e => {
      if (!(e.clientX && e.clientY)) {
        return;
      }
      
      // get the new mouse pos
      const newPos = new Vector2 (
        e.clientX * this.dppr,
        e.clientY * this.dppr
      )
      // get the vector from the last mouse position to the new one
      const delta = newPos.subtract(this.lastMousePos);
      const worldUnitDelta = delta.applyFunction(
        n => this.screenPixelsToWorldUnits(n)
      );

      this.setPan(
        this.pan.subtract(worldUnitDelta)
      );

      // update the last mouse position
      this.lastMousePos = newPos;
    })

  }

  private stopFollowingMouse() {
    $(document).off('mousemove.followMouse');
    $(document).off('mouseup.stopFollowingMouse');
  }

  /** Convert world coordinates to screen coordinates (pixels) */
  public worldPosToScreen(worldPos: Vector2) {
    return worldPos.subtract(this.pan).mult(this.zoom * this.baseCellPixels);
  }

  /** Convert screen coordinates (pixels) to world coordinates */
  public screenToWorld(screenPos: Vector2) {
    return screenPos.divide(this.zoom * this.baseCellPixels).add(this.pan);
  }

  public worldUnitsToScreenPixels(units: number) {
    return units * this.zoom * this.baseCellPixels;
  }

  public screenPixelsToWorldUnits(pixels: number) {
    return pixels / (this.zoom * this.baseCellPixels);
  }

  public getPan() {
    return this.pan.fixedCopy();
  }

  public setPan(newPan: Vector2) {
    this.pan = this.boundPan(newPan);
  }

  public setZoom(newZoom: number) {
    this.zoom = this.boundZoom(newZoom);
  }

  private fitToScreen() {
    this.windowDims = new Vector2(
      $(document).width()! * this.dppr,
      $(document).height()! * this.dppr
    )

    this.minZoom = this.computeMinZoom();
  }

  /**calculate how many cells you should be able to see right now*/
  public calcWorldUnitsOnScreen(): Vector2 {
    const cellDim = this.worldUnitsToScreenPixels(1);
    return this.windowDims.divide(cellDim);
  }

  public getWindowDims() {
    return this.windowDims
  }

  private computeMinZoom(): number {
    // how many pixels wide and tall the whole world would be at zoom=1
    const worldPixels = this.worldSize.mult(this.baseCellPixels);

    // how much we must scale (zoom) so that worldPixels fit inside windowDims
    const zoom = new Vector2(
      this.windowDims.getX() / worldPixels.getX(),
      this.windowDims.getY() / worldPixels.getY()
    );

    return Math.max(zoom.getX(), zoom.getY()); // smallest zoom that fits whole world
  }

  private handleResize() {
    this.fitToScreen();

    // bounds the zoom so it fits to the new page
    this.setZoom(this.zoom);
  }

  private boundZoom(zoom: number): number {
    return Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
  }

  private boundPan(pan: Vector2): Vector2 {
    const worldUnitsOnScreen = this.calcWorldUnitsOnScreen();
    const maxPan = this.worldSize.subtract(worldUnitsOnScreen);

    return new Vector2(
      Math.max(0, Math.min(pan.getX(), maxPan.getX())),
      Math.max(0, Math.min(pan.getY(), maxPan.getY()))
    );
  }
}