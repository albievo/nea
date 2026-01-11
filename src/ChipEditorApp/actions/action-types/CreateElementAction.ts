import { Vector2 } from "../../../utils/Vector2";
import { Chip } from "../../controller/objectControllers.ts/Chip";
import { ActionContext, UndoableAction } from "../Action";

export class CreateInputElementAction implements UndoableAction {
  undoable: true = true;

  constructor(
    private id: string,
    private pos: Vector2
  ) { }

  do(ctx: ActionContext): void {
    Chip.createInputChip(
      ctx.chip, ctx.renderManager,
      this.id, this.pos
    )
  }

  undo(ctx: ActionContext): void {
    Chip.deleteChip(
      ctx.chip, ctx.renderManager,
      this.id
    )
  }
}