import { Netlist, NodeType } from "../netlist/Netlist";
import { BehaviourSpec, createBehaviour } from "./BehaviourSpec";
import { checkStaticBehavioursAreEquivalent, NetlistBehaviour } from "./ChipBehaviour";

export type ChipDefinition = {
  id: string;
  name: string;
  behaviourSpec: BehaviourSpec;
  icon: string;
  inputs: number,
  outputs: number
};

export type GenericChipDetails =
  { type: NodeType.CHIP, defId: string } |
  { type: NodeType.INPUT } |
  { type: NodeType.OUTPUT }

/**
 * returns undefined if input ot output, or the definition if there 
 * is one
 */
export function getGenericChipDef(
  chipLibrary: ChipLibrary, dets: GenericChipDetails
): ChipDefinition | undefined {
  return dets.type === NodeType.CHIP
    ? chipLibrary.get(dets.defId)
    : undefined
}

export class ChipLibrary {
  private definitions = new Map<string, ChipDefinition>();

  register(definition: ChipDefinition): void;
  register(definitions: ChipDefinition[]): void;

  register(def: ChipDefinition | ChipDefinition[]): void {
    if (Array.isArray(def)) {
      for (const definition of def) {
        this.register(definition)
      }
      return;
    }

    const duplicate = this.definitions.has(def.id)
    if (duplicate) throw new Error(`Duplicate chip id: ${def.id}`);

    this.definitions.set(def.id, def);
  }

  get(id: string): ChipDefinition {
    const def = this.definitions.get(id);
    if (!def) throw new Error(`Unknown chip id: ${id}`);
    return def;
  }

  has(id: string) {
    return this.definitions.has(id);
  }

  list(): ChipDefinition[] {
    return [...this.definitions.values()];
  }

  /**
   * searches primitives in library to check if the netlist's behaviour matches one
   * 
   * if one is found, returns the id
   */
  findEquivalentStaticPrimitive(netlist: Netlist): string | undefined {
    if (!netlist.isStatic()) {
      throw new Error('netlist must be static');
    }
    const netlistBehaviour = new NetlistBehaviour(netlist);

    for (let [id, def] of this.definitions) {
      if (def.behaviourSpec.kind !== 'primitive') {
        continue;
      }

      if (
        netlist.getInputNum() !== def.inputs ||
        netlist.getOutputNum() !== def.outputs
      ) {
        continue;
      }

      const primBehaviour = createBehaviour(this, def.behaviourSpec);

      const equivalent = checkStaticBehavioursAreEquivalent(netlistBehaviour, primBehaviour);

      if (equivalent) {
        return id;
      }
    }

    return undefined;
  }
}