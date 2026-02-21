import events from "../event/events";
import { Vector2 } from "../../utils/Vector2";
import $ from 'jquery';
import { BoundingBox } from "./renderables/Renderable";

export class Camera {
  private pan!: Vector2; // top-left of screen in world units
  private dppr: number;

  private minZoom = 1;
  private maxZoom = 15;
  private zoomCoeff = 0.0005;

  private worldSize: Vector2;
  private windowDims!: Vector2;

  readonly baseCellPixels = 48;

  private _isPanning: boolean = false;

  constructor(
    worldSize: Vector2, dppr: number,
    private zoom: number
  ) {
    this.dppr = dppr;
    this.worldSize = worldSize;

    // does min zoom
    this.fitToScreen();
    this.zoom = this.boundZoom(this.zoom);
    
    //centre camera
    const worldUnitsOnScreen = this.calcWorldUnitsOnScreen();
    this.setPan(
      worldSize.subtract(worldUnitsOnScreen)
        .divide(2)
    );

    events.on('resize', () => this.handleResize());
  }

  public zoomAt(worldPos: Vector2, wheelDelta: number) {
    // mouse position in screen pixels
    const mouseScreen = this.worldPosToScreen(worldPos);

    // just used to check whether there has been a change
    // const oldZoom = this.zoom;

    // compute new zoom
    const rawZoomFactor = 1 + (wheelDelta * this.zoomCoeff);
    this.setZoom(this.zoom * rawZoomFactor);

    // adjust pan to keep mouseWorld under cursor
    const newMouseWorld = this.screenToWorld(mouseScreen);
    const delta = newMouseWorld.subtract(worldPos);
    this.setPan(this.pan.subtract(delta));

    // const zoomFactor = this.zoom / oldZoom;

    // if (zoomFactor !== 1) {
    //   events.emit('zoom', { factor: zoomFactor, screenPos: mouseScreen });
    // }
  }

  public panBy(delta: Vector2) {
    this.setPan(
      this.pan.subtract(delta)
    );
  }

  /** Convert world coordinates to screen coordinates (CSS pixels) */
  public worldPosToScreen(worldPos: Vector2) {
    return worldPos.subtract(this.pan).mult(this.calcScaleFactor());
  }

  /** Convert screen coordinates (CSS pixels) to world coordinates */
  public screenToWorld(screenPos: Vector2) {
    return screenPos.divide(this.calcScaleFactor()).add(this.pan);
  }

  private calcScaleFactor() {
    return this.zoom * this.baseCellPixels;
  }


  public worldUnitsToScreenPixels(units: number) {
    return units * this.calcScaleFactor();
  }

  public screenPixelsToWorldUnits(pixels: number) {
    return pixels / this.calcScaleFactor();
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
      $(document).width()!,
      $(document).height()!
    )

    this.minZoom = this.calcMinZoom();
  }

  /**calculate how many cells you should be able to see right now*/
  public calcWorldUnitsOnScreen(): Vector2 {
    const cellDim = this.worldUnitsToScreenPixels(1); // CSS px per world unit
    return this.windowDims.divide(cellDim);
  }

  public getWindowDims() {
    return this.windowDims
  }

  private calcMinZoom(): number {
    // how many pixels wide and tall the whole world would be at zoom=1
    const worldPixels = this.worldSize.mult(this.baseCellPixels);

    // how much we must scale (zoom) so that worldPixels fit inside windowDims
    const zoom = new Vector2(
      this.windowDims.x / worldPixels.x,
      this.windowDims.y / worldPixels.y
    );

    return Math.max(zoom.x, zoom.y);
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

    const finalPan = new Vector2(
      Math.max(0, Math.min(pan.x, maxPan.x)),
      Math.max(0, Math.min(pan.y, maxPan.y))
    );

    return finalPan;
  }

  /**
   * returns a boolean value representing whether a given world position is currently on the screen
  */
  public isOnScreen(point: Vector2): boolean {
    const screenPos = this.worldPosToScreen(point);
    
    const isLeft = screenPos.x < 0;
    const isAbove = screenPos.y < 0;
    const isRight = screenPos.x > this.windowDims.x;
    const isBelow = screenPos.y > this.windowDims.y;

    return !(isLeft || isAbove || isRight || isBelow);
  }

  public intersects(boundingBox: BoundingBox): boolean {
    const bottomRight = this.pan.add(this.calcWorldUnitsOnScreen());

    // If one rectangle is to the left of the other
    if (this.pan.x > boundingBox.right || boundingBox.left > bottomRight.x)
      return false;

    // If one rectangle is above the other
    if (this.pan.y > boundingBox.bottom || boundingBox.top > bottomRight.y)
      return false;

    return true;
  }

  public getWorldPosFromJqueryMouseEvent(event: JQuery.MouseEventBase): Vector2 {
    const screenPos = new Vector2(
      event.clientX,
      event.clientY
    );
    return this.screenToWorld(screenPos);
  }

  public getWorldPosFromDOMWheelEvent(event: WheelEvent) {
    const screenPos = new Vector2(
      event.clientX,
      event.clientY
    );

    return this.screenToWorld(screenPos);
  }

  public get isPanning(): boolean {
    return this._isPanning;
  }
}