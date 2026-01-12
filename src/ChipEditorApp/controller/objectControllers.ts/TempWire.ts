import { Vector2 } from "../../../utils/Vector2";
import { AStarPathfinder } from "../../../utils/pathfinding/AStarPathfinder";
import { RenderManager } from "../../rendering/RenderManager";
import { CellTakenBy } from "../../model/WorkingChip";

export class TempWire {
  public static deleteTempWire(
    id: string,
    renderManager: RenderManager
  ) {
    renderManager.rmvRenderable(id);
  }
}