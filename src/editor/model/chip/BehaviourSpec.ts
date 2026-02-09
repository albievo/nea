import { Netlist } from "../netlist/Netlist";
import { SerializedNetlist } from "../netlist/SerializedNetlist";
import { ChipBehaviour, NetlistBehaviour, PrimitiveBehaviour, TruthtableBehaviour } from "./ChipBehaviour";
import { ChipLibrary } from "./ChipLibrary";
import { PrimitiveType } from "./primitives";

export type BehaviourSpec = 
  | { kind: "primitive"; type: PrimitiveType }
  | { kind: "truthtable"; table: number[]; inputs: number, outputs: number }
  | { kind: "netlist"; serialized: SerializedNetlist; idxToInputId: Map<number, string>};

export type BehaviourKind = 'primitive' | 'truthtable' | 'netlist';


export function createBehaviour(chipLibrary: ChipLibrary, spec: BehaviourSpec): ChipBehaviour {
  switch (spec.kind) {
    case "primitive":
      return new PrimitiveBehaviour(spec.type);

    case "truthtable":
      return new TruthtableBehaviour(spec.table, spec.inputs, spec.outputs);

    case "netlist": {
      return new NetlistBehaviour(Netlist.fromSerialized(spec.serialized, chipLibrary), spec.idxToInputId)
    }
  }
}