import { TempWireRenderable } from "../rendering/renderables/wires/TempWireRenderable";
import { Vector2 } from "../../utils/Vector2";

export interface InteractionState {
  tempWire?: {
    renderable: TempWireRenderable;
    fromId: string;
    fromIdx: number;
  }
  activeInputPin?: {
    elementId: string,
    pinIdx: number
  }
  onOutputPin?: number;
  onElement?: string;
  draggingElement?: {
    startingPos: Vector2,
    renderableId: string
  }
  space?: boolean;
  panning?: {
    mouseDown: Vector2
  }
}