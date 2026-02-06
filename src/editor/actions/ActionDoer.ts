import { Action, ActionContext, UndoableAction } from "./Action";
import { Stack } from "../../utils/Stack";
import { RenderManager } from "../rendering/RenderManager";
import { WorkingChip } from "../model/WorkingChip";
import { Camera } from "../rendering/Camera";
import { InteractionState } from "../controller/InteractionState";
import { ChipLibrary } from "../model/chip/ChipLibrary";


export class ActionDoer {
  private undoStack = new Stack<UndoableAction>(32);
  private redoStack = new Stack<UndoableAction>(32);
  private ctx: ActionContext;

  constructor(
    renderManager: RenderManager,
    chip: WorkingChip,
    camera: Camera,
    interactionState: InteractionState,
    chipLibrary: ChipLibrary
  ) {
    this.ctx = {
      renderManager, 
      chip,
      camera,
      interactionState,
      chipLibrary
    }
  }

  /**
   * @returns true if the action succeeded, false otherwise
   */
  public do(action: Action): boolean {
    try {
      action.do(this.ctx);
    } catch (err) {
      console.error(err);
      return false;
    }

    if (action.undoable) {
      this.undoStack.push(action);
    }

    this.redoStack.clear();

    return true;
  }

  public undo() {
    const action = this.undoStack.pop();
    if (!action) {
      return
    }
    action.undo(this.ctx);
    this.redoStack.push(action);
  };

  public redo() {
    const action = this.redoStack.pop();
    if (!action) {
      return;
    }
    action.do(this.ctx);
    this.undoStack.push(action);
  }
}