import { Vector2 } from "../../../utils/Vector2";
import { Chip } from "../../controller/objectControllers.ts/Chip";
import { createBehaviour } from "../../model/chip/BehaviourSpec";
import { ChipBehaviour } from "../../model/chip/ChipBehaviour";
import { ChipDefinition } from "../../model/chip/ChipLibrary";
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
    );

    const newState = ctx.chip.updateNetlist(ctx.interactionState.inputElements);
    ctx.renderManager.updateRenderState(newState);
  }

  public abstract do(ctx: ActionContext): void
}

export class CreateInputElementAction extends CreateElementAction {
  constructor(id: string, pos: Vector2) {
    super(id, pos);
  }

  do(ctx: ActionContext): void {
    Chip.createInputChip(
      ctx.chip, ctx.renderManager, ctx.interactionState,
      this.id, this.pos
    );

    const newState = ctx.chip.updateNetlist(ctx.interactionState.inputElements);
    ctx.renderManager.updateRenderState(newState);
  }
}

export class CreateOutputElementAction extends CreateElementAction {
  constructor(id: string, pos: Vector2) {
    super(id, pos);
  }

  do(ctx: ActionContext): void {
    Chip.createOutputChip(
      ctx.chip, ctx.renderManager,
      this.id, this.pos
    );

    const newState = ctx.chip.updateNetlist(ctx.interactionState.inputElements);
    ctx.renderManager.updateRenderState(newState);
  }
}

export class CreateChipElementAction extends CreateElementAction {

  constructor(id: string, private definition: ChipDefinition, pos: Vector2) {
    super(id, pos);
  }

  do(ctx: ActionContext) {
    Chip.createChip(
      ctx.chip, ctx.renderManager,
      this.id, createBehaviour(this.definition.behaviourSpec), this.pos
    );

    const newState = ctx.chip.updateNetlist(ctx.interactionState.inputElements);
    ctx.renderManager.updateRenderState(newState);
  }
}