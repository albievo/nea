import { Vector2 } from "../../../utils/Vector2";
import { Chip } from "../../controller/objectControllers.ts/Chip";
import { ActionContext, UndoableAction } from "../Action";

abstract class CreateElementAction implements UndoableAction {
  undoable: true = true;

  constructor(
    protected id: string,
    protected pos: Vector2
  ) { }

  undo(ctx: ActionContext): void {
    Chip.deleteChip(
      ctx.chip, ctx.renderManager,
      this.id
    )
  }

  public abstract do(ctx: ActionContext): void
}

export class CreateInputElementAction extends CreateElementAction {
  undoable: true = true;

  constructor(id: string, pos: Vector2) {
    super(id, pos);
  }

  do(ctx: ActionContext): void {
    Chip.createInputChip(
      ctx.chip, ctx.renderManager,
      this.id, this.pos
    )
  }
}

export class CreateOutputElementAction extends CreateElementAction {
  undoable: true = true;

  constructor(id: string, pos: Vector2) {
    super(id, pos);
  }

  do(ctx: ActionContext): void {
    Chip.createOutputChip(
      ctx.chip, ctx.renderManager,
      this.id, this.pos
    )
  }
}