import { Renderable, RenderableKind } from './renderables/Renderable';
import { GridElementRenderable } from './renderables/grid-elements/GridElementRenderable';
import { TempWireRenderable } from './renderables/wires/TempWireRenderable';
import { PermWireRenderable } from './renderables/wires/PermWireRenderable';

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

export function isPermWireRenderable(
  value: unknown
): value is PermWireRenderable {
  return value instanceof PermWireRenderable;
}