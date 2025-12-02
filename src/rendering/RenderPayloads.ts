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
  camera?: boolean;
  resize?: boolean;
}

export interface InitialGridElementPayload {
  color: "red" | "green" | "blue"
}

// export interface GridElementPayload {
//   initial?: InitialGridElementPayload
// }

export type RenderPayload = 
  GridPayload
  // GridElementPayload