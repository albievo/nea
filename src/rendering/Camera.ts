import { Vector2 } from "../utils/Vector2";
import $ from 'jquery';

export class Camera {
  private zoom: number;
  private pan: Vector2; // top-left of screen in world units
  private dppr: number;

  private MIN_ZOOM = 1;
  private maxZoom: number;
  private zoomCoeff: number;

  private lastMousePos = new Vector2(0, 0);

  constructor(
    zoom: number, pan: Vector2,
    dppr: number, maxZoom: number, zoomCoeff: number
  ) {
    this.zoom = zoom;
    this.pan = pan.copy();
    this.dppr = dppr;
    this.maxZoom = maxZoom;
    this.zoomCoeff = zoomCoeff;

    $(document).on('wheel', e => this.handleWheel(e));
    $(document).on('mousedown', e => this.handleMouseDown(e));
  }

  private handleWheel(event: JQuery.TriggeredEvent) {
    const DOMEvent = event.originalEvent as WheelEvent;

    // mouse position in screen pixels
    const mouseScreen = new Vector2(DOMEvent.clientX * this.dppr, DOMEvent.clientY * this.dppr);
    const mouseWorld = this.screenToWorld(mouseScreen);

    // compute new zoom
    const rawZoom = this.zoom * (1 + DOMEvent.deltaY * this.zoomCoeff);
    const boundedZoom = Math.min(this.maxZoom, Math.max(this.MIN_ZOOM, rawZoom));

    // adjust pan to keep mouseWorld under cursor
    // newPan + mouseWorldOffset * newZoom = mouseScreen
    // => newPan = mouseWorld - (mouseScreen / newZoom)
    this.pan = mouseWorld.subtract(mouseScreen.divide(boundedZoom));

    this.zoom = boundedZoom;
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

      console.log(delta);

      this.pan = this.pan.subtract(worldUnitDelta);

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
    return worldPos.subtract(this.pan).mult(this.zoom);
  }

  /** Convert screen coordinates (pixels) to world coordinates */
  public screenToWorld(screenPos: Vector2) {
    return screenPos.divide(this.zoom).add(this.pan);
  }

  public worldUnitsToScreenPixels(units: number) {
    return units * this.zoom;
  }

  public screenPixelsToWorldUnits(pixels: number) {
    return pixels / this.zoom;
  }

  public getZoom() {
    return this.zoom;
  }

  public getPan() {
    return this.pan.fixedCopy();
  }
}