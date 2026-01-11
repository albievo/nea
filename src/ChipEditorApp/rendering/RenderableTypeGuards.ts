import { Renderable, RenderableKind } from './renderables/Renderable';
import { GridElementRenderable } from './renderables/GridElementRenderable';
import { TempWireRenderable } from './renderables/wires/TempWireRenderable';

export function isGridElementRenderable(
  value: unknown
): value is GridElementRenderable {
  return value instanceof GridElementRenderable;
}

export function isTempWireRenderable(
  value: unknown
): value is TempWireRenderable {
  return value instanceof TempWireRenderable;
}