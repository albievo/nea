export interface RenderPayload {
  kind: RenderKind;
}

export interface InitialGridRenderPayload extends RenderPayload {
  kind: "initial-grid-render";

  height: number;
  width: number;
  startingZoom: number;
  maxZoom: number;
  zoomCoefficient: number;
}

export type RenderKind = 
  "initial-grid-render"

export type RenderPayloadMap = {
  "initial-grid-render": InitialGridRenderPayload;
  // add more later
};

export type AnyRenderPayload = RenderPayloadMap[RenderKind];