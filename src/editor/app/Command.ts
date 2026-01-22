import { Vector2 } from "../../utils/Vector2";
import { BehaviourSpec } from "../model/chip/BehaviourSpec";

export type Command =
  | { type: "add-input-element"; pos: Vector2; id?: string }
  | { type: "add-output-element"; pos: Vector2; id?: string }
  | { type: "add-chip-element"; pos: Vector2; id?: string, behaviour: BehaviourSpec }
  ;