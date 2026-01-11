import { Vector2 } from "../../../utils/Vector2";
import { Chip } from "../../controller/objectControllers.ts/Chip";
import { RenderManager } from "../../rendering/RenderManager";
import { ActionContext, UndoableAction } from "../Action";

export class MoveElementAction implements UndoableAction {
  undoable: true = true;

  constructor(
    private id: string,
    private from: Vector2, private to: Vector2
  ) { }

  do(ctx: ActionContext): void {
    const isValidPosition = Chip.checkValidPosition(
      ctx.chip, ctx.renderManager, this.id, this.to
    );
    if (!isValidPosition) return;

    ctx.chip.updateChipPosition(this.id, this.to);
    
    const renderable = ctx.renderManager.getGridElementWithId(this.id);
    if (!renderable) return;
    renderable.pos = this.to;
  }

  undo(ctx: ActionContext): void {
    ctx.chip.updateChipPosition(this.id, this.from);

    const renderable = ctx.renderManager.getGridElementWithId(this.id);
    if (!renderable) return;
    renderable.pos = this.from;
  }
}