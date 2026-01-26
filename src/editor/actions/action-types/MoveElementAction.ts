import { Vector2 } from "../../../utils/Vector2";
import { Chip } from "../../controller/objectControllers.ts/Chip";
import { PermWire } from "../../controller/objectControllers.ts/PermWire";
import { ActionContext, UndoableAction } from "../Action";
import { GridElementRenderable } from "../../rendering/renderables/grid-elements/GridElementRenderable";

export class MoveElementAction implements UndoableAction {
  undoable: true = true;
  private renderable?: GridElementRenderable;

  constructor(
    private id: string,
    private from: Vector2, private to: Vector2
  ) { }

  do(ctx: ActionContext): void {
    const isValidPosition = Chip.checkValidPosition(
      ctx.chip, ctx.renderManager, this.id, this.to
    );
    if (!isValidPosition) return;

    this.renderable = ctx.renderManager.
      getGridElementWithId(this.id) ?? undefined;
    
    if (!this.renderable) return;

    ctx.chip.updateChipPosition(
      this.id,
      this.from, this.to,
      this.renderable.dims
    );
    this.renderable.pos = this.to;

    for (const permWireId of ctx.renderManager.permWires) {
      PermWire.updatePath(ctx.chip, ctx.renderManager, permWireId);
    }
  }

  undo(ctx: ActionContext): void {   
    if (!this.renderable) return;

    ctx.chip.updateChipPosition(
      this.id,
      this.to, this.from,
      this.renderable.dims
    );
    this.renderable.pos = this.from;

    for (const permWireId of ctx.renderManager.permWires) {
      PermWire.updatePath(ctx.chip, ctx.renderManager, permWireId);
    }
  }
}