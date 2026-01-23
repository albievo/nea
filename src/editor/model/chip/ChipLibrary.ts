import { BehaviourSpec } from "./BehaviourSpec";

export type ChipDefinition = {
  id: string;
  name: string;
  behaviourSpec: BehaviourSpec;
  icon: string;
};

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