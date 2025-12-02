import { Vector2 } from "../utils/Vector2";
import $ from 'jquery';


export class Camera {
  private zoom: number;
  private pan: Vector2;
  
  private dppr: number;

  private MIN_ZOOM = 1;
  private maxZoom: number;
  private zoomCoeff: number;

  constructor(zoom: number, pan: Vector2, dppr: number, maxZoom: number, zoomCoeff: number) {
    this.zoom = zoom;
    this.pan = pan.copy();
    this.dppr = dppr;
    this.maxZoom = maxZoom;
    this.zoomCoeff = zoomCoeff

    $(document).on('wheel', e => this.handleWheel(e));
  }


  /**
  Handles on a wheel specifically so that:
  a) the wheel has an origin location, around which we zoom, and
  b) zooming by touch doesn't really make sense: the action should pan
  */
  private handleWheel(event: JQuery.TriggeredEvent) {
    // get the raw DOM event
    const DOMEvent = event.originalEvent as WheelEvent;

    // get the mouse pos
    const mousePos = new Vector2(
      DOMEvent.clientX * this.dppr,
      DOMEvent.clientY * this.dppr
    );

    // the position of the mouse in world co ordinates
    const mousePosWorld = mousePos
      .subtract(this.pan)
      .divide(this.zoom);
    
    // calculate the new zoom
    const rawZoom = this.zoom * (1 + DOMEvent.deltaY * this.zoomCoeff);
    const boundedZoom = Math.min(
      this.maxZoom, Math.max(this.MIN_ZOOM, rawZoom)
    )
    this.zoom = boundedZoom;

    // calculate the new pan
    this.pan = this.pan
      .subtract(mousePosWorld)
      .mult(this.zoom);
  }

  public worldPosToScreen(worldPos: Vector2) {
    return worldPos.mult(this.zoom).subtract(this.pan);
  }

  public worldUnitsToScreenPixels(units: number) {
    return units * this.zoom;
  }

  public getZoom() {
    return this.zoom;
  }

  public getPan() {
    return this.pan.fixedCopy();
  }
}