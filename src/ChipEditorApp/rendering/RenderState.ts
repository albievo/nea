import { Value } from "../model/netlist/Value"

export interface RenderState {
  wires: Map<string, Value>,
  inputPins: Map<string, Map<number, Value>>,
  outputPins: Map<string, Map<number, Value>>
}

export function createEmptyRenderState(): RenderState {
  return {
    wires: new Map<string, Value>(),
    inputPins: new Map<string, Map<number, Value>>(),
    outputPins: new Map<string, Map<number, Value>>()
  }
}