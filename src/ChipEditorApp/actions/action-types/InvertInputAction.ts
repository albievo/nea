import { Value } from "../../model/netlist/Value";
import { ActionContext, NonUndoableAction } from "../Action";

export class InvertInputAction implements NonUndoableAction {
  undoable: false = false;

  constructor(private id: string) { }

  do(ctx: ActionContext): void {
    ctx.interactionState.inputElements.set(this.id,
      Value.negate(ctx.interactionState.inputElements.get(this.id)!)
    );
    ctx.chip.updateNetlist(ctx.interactionState.inputElements);
  }
}