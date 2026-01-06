import { Vector2 } from "../utils/Vector2";
import { RenderableKind } from "./Renderable";

export interface InitialGridRenderPayload {
  size: Vector2;
}

export interface InitialGridElementPayload {
  color: "red" | "green" | "blue";
}

export interface GridElementMovePayload {
  delta: Vector2;
}

export interface RenderBuffer {
  kind: RenderableKind
  camera?: boolean,
  resize?: boolean,
}

export interface GridElementRenderBuffer extends RenderBuffer {
  kind: 'grid-element',
  initial?: InitialGridElementPayload,
  movement?: Vector2,
  activation?: number
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

export interface PermWireRenderBuffer extends RenderBuffer {
  kind: 'perm-wire';
  updatedPath?: Vector2[];
}

export type RenderBufferByKind = {
  grid: GridRenderBuffer;
  'grid-element': GridElementRenderBuffer;
  'temp-wire': TempWireRenderBuffer;
  'perm-wire': PermWireRenderBuffer;
};

export type AnyRenderBuffer = GridRenderBuffer | GridElementRenderBuffer | TempWireRenderBuffer | PermWireRenderBuffer;

export class RenderBufferUtils {
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