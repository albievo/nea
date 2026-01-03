import { Vector2 } from "../utils/Vector2";
import { RenderableKind } from "./Renderable";

export interface InitialGridRenderPayload {
  size: Vector2;
}

export interface InitialGridElementPayload {
  color: "red" | "green" | "blue";
}

export interface InitialTempWirePayload {

}

export interface GridElementMovePayload {
  delta: Vector2;
}

export interface RenderPayload {
  camera?: boolean;
  resize?: boolean;
  initialGrid?: InitialGridRenderPayload;
  initialGridElements?: InitialGridElementMap; //  maps element ID to the payload
  initialTempWire?: InitialTempWirePayload;
  gridElementsMovement?: GridElementMovementMap;
  updatedTempWirePath?: Vector2[];
}

export interface RenderBuffer {
  kind: RenderableKind
  camera?: boolean,
  resize?: boolean,
}

export interface GridElementRenderBuffer extends RenderBuffer {
  kind: 'grid-element',
  initial?: InitialGridElementPayload,
  movement?: Vector2
}

export interface GridRenderBuffer extends RenderBuffer {
  kind: 'grid',
  initial?: InitialGridRenderPayload
}

export interface TempWireRenderBuffer extends RenderBuffer {
  kind: 'temp-wire';
  initial?: boolean;
  updatedPath?: Vector2[];
}

export type RenderBufferByKind = {
  grid: GridRenderBuffer;
  'grid-element': GridElementRenderBuffer;
  'temp-wire': TempWireRenderBuffer;
};

type RenderPayloadBooleanMap = {
  [K in keyof RenderPayload]: boolean;
};

export type AnyRenderBuffer = GridRenderBuffer | GridElementRenderBuffer | TempWireRenderBuffer;

export const PayloadRequiresFullRender: RenderPayloadBooleanMap = {
  camera: true,
  resize: true,
  initialGrid: true,
  initialGridElements: false,
  gridElementsMovement: true,
  updatedTempWirePath: true
};

export type InitialGridElementMap = { [id: string]: InitialGridElementPayload };
export type GridElementMovementMap = { [id: string]: GridElementMovePayload };

export type InitialTempWireMap = { [id: string]: InitialTempWirePayload };

export class RenderPayloadUtils {

  public static payloadRequiresFullRender(payload: RenderPayload): boolean {
    return (Object.keys(payload) as (keyof RenderPayload)[])  // get all keys of payload
      .some(key => PayloadRequiresFullRender[key]);           // check if any of the keys needs a full render
  }

  public static mergeGenericProperties<T extends RenderBuffer>(
    original: T,
    toAdd: T
  ): T {
    return {
      ...original,
      camera: original.camera || toAdd.camera,
      resize: original.resize || toAdd.resize,
    };
  }
}