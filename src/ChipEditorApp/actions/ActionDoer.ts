import { Action, ActionContext, UndoableAction } from "./Action";
import { Stack } from "../../utils/Stack";
import { RenderManager } from "../rendering/RenderManager";
import { WorkingChip } from "../model/WorkingChip";
import { Camera } from "../rendering/Camera";


export class ActionDoer {
  private undoStack = new Stack<UndoableAction>();
  private redoStack = new Stack<UndoableAction>();
  private ctx: ActionContext;

  constructor(
    renderManager: RenderManager,
    chip: WorkingChip,
    camera: Camera
  ) {
    this.ctx = {
      renderManager, 
      chip,
      camera
    }
  }

  public do(action: Action) {
    try {
      action.do(this.ctx);
    } catch (err) {
      console.error(err);
      return;
    }

    if (action.undoable) {
      this.undoStack.push(action);
    }
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