import { PermWire } from "../../controller/objectControllers.ts/PermWire";
import { InputPin, OutputPin } from "../../model/netlist/Pins";
import { ActionContext, UndoableAction } from "../Action";

export class CreateConnectionAction implements UndoableAction {
  undoable: true = true;

  constructor(
    private id: string,
    private from: OutputPin,
    private to: InputPin,
  ) { }

  do(ctx: ActionContext): void {
    PermWire.create(
      ctx.chip, ctx.renderManager,
      this.id, this.from, this.to
    );

    const newState = ctx.chip.updateNetlist(ctx.interactionState.inputElements);
    ctx.renderManager.renderState = newState;
  }

  undo(ctx: ActionContext): void {
    PermWire.delete(
      ctx.chip, ctx.renderManager,
      this.id
    );

    const newState = ctx.chip.updateNetlist(ctx.interactionState.inputElements);
    ctx.renderManager.renderState = newState;
  }
}