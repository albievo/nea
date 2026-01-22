import { SerializedNetlist } from "../netlist/Netlist";
import { ChipBehaviour, PrimitiveBehaviour, TruthtableBehaviour } from "./ChipBehaviour";
import { PrimitiveType } from "./primitives";

export type BehaviourSpec = 
  | { kind: "primitive"; type: PrimitiveType }
  | { kind: "truthtable"; table: number[]; inputs: number, outputs: number }
  | { kind: "netlist"; definition: SerializedNetlist };

export type BehaviourKind = 'primitive' | 'truthtable' | 'netlist';


export function createBehaviour(spec: BehaviourSpec): ChipBehaviour {
  switch (spec.kind) {
    case "primitive":
      return new PrimitiveBehaviour(spec.type);

    case "truthtable":
      return new TruthtableBehaviour(spec.table, spec.inputs, spec.outputs);

    case "netlist": {
      throw new Error('not yet implemented');
    }
  }
}