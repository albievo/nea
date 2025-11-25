import { Vector2 } from "../utils/Vector2";

export interface InitialGridRenderPayload {
  height: number;
  width: number;
  startingZoom: number;
  maxZoom: number;
  zoomCoefficient: number;
}

export interface ZoomPayload {
  delta: number;
  mousePos: Vector2;
}

export interface GridPayload {
  initial?: InitialGridRenderPayload,
  movement?: Vector2;
  zoom?: ZoomPayload;
}

export type RenderPayload = 
  GridPayload