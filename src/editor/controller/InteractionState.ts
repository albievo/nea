import { TempWireRenderable } from "../rendering/renderables/wires/TempWireRenderable";
import { Vector2 } from "../../utils/Vector2";
import { InputPin, OutputPin } from "../model/chip/Pins";
import { Value } from "../model/netlist/Value";
import { GhostElementRenderable } from "../rendering/renderables/grid-elements/GhostElementRenderable";
import { NodeType } from "../model/netlist/Netlist";
import { GenericChipDetails } from "../model/chip/ChipLibrary";

export interface InteractionState {
  tempWire?: {
    renderable: TempWireRenderable;
    fromId: string;
    fromIdx: number;
  }
  activeInputPin?: InputPin;
  onOutputPin?: OutputPin;
  onElement?: string;
  draggingElement?: {
    startingPos: Vector2,
    renderableId: string
  }
  space?: boolean;
  panning?: {
    mouseDown: Vector2
  }
  onInputBtn?: boolean;
  inputElements: Map<string, Value>;
  ghostElement?: {
    renderable: GhostElementRenderable;
    validPosition: boolean;
    details: GenericChipDetails
  }
}

export function emptyInteractionState(state: InteractionState) {
  Object.assign(state, createEmptyInteractionState);
}

export function createEmptyInteractionState(): InteractionState {
  return { inputElements: new Map<string, Value>() }
}