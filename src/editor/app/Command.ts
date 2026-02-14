import { EditorUI } from "../../ui/EditorUI";
import { Vector2 } from "../../utils/Vector2";
import { GenericChipDetails } from "../model/chip/ChipLibrary";

export type Command =
  | { type: "add-input-element"; pos: Vector2; id?: string }
  | { type: "add-output-element"; pos: Vector2; id?: string }
  | { type: "add-chip-element"; pos: Vector2; defId: string; elemId?: string }
  | { type: "add-ghost-element"; details: GenericChipDetails; mousePos: Vector2 }
  | { type: "save-current-chip"; ui: EditorUI }
  ;