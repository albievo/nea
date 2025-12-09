import { Vector2 } from "../utils/Vector2";

export interface InitialGridRenderPayload {
  size: Vector2;
  startingZoom: number;
  maxZoom: number;
  zoomCoefficient: number;
}

export interface ZoomPayload {
  delta: number;
  mousePos: Vector2;
}

export interface GridPayload {
  kind: "grid";
  initial?: InitialGridRenderPayload;
  camera?: boolean;
  resize?: boolean;
}

export interface GridElementPayload {
  kind: "grid-element";
  initial?: InitialGridElementPayload;
  camera?: boolean;
  resize?: boolean;
}

export interface InitialGridElementPayload {
  color: "red" | "green" | "blue";
}

export type RenderPayload = 
  GridPayload |
  GridElementPayload

export type RenderPayloadKind = RenderPayload["kind"];