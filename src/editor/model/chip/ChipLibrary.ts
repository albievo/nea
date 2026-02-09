import { NodeType } from "../netlist/Netlist";
import { BehaviourSpec } from "./BehaviourSpec";

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
}