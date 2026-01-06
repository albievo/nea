import { Renderable, RenderableKind } from './Renderable';
import { GridElement } from './GridElement';

export function isGridElement(
  r: Renderable<RenderableKind> | undefined
): r is GridElement {
  return r?.kind === 'grid-element';
}