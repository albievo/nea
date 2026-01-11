import { Vector2 } from "../../utils/Vector2";

export type Command =
  | { type: "add-input-element"; pos: Vector2; id?: string }
  | { type: "add-output-element"; pos: Vector2; id?: string }
  ;