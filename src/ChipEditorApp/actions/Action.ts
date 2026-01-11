import { RenderManager } from "../rendering/RenderManager";
import { Camera } from "../rendering/Camera";
import { CellTakenBy, WorkingChip } from "../WorkingChip";

export interface BaseAction {
  do(ctx: ActionContext): void;
}

export interface NonUndoableAction extends BaseAction {
  undoable: false;
}

export interface UndoableAction extends BaseAction {
  undoable: true;
  undo(ctx: ActionContext): void;
}

export type Action = NonUndoableAction | UndoableAction;

export interface ActionContext {
  renderManager: RenderManager;
  camera: Camera;
  chip: WorkingChip;
}