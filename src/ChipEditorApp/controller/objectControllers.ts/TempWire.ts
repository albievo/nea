import { Vector2 } from "../../../utils/Vector2";
import { AStarPathfinder } from "../../rendering/pathfinding/AStarPathfinder";
import { RenderManager } from "../../rendering/RenderManager";
import { CellTakenBy } from "../../WorkingChip";

export class TempWire {
  public static computePath(
    from: Vector2,
    to: Vector2,
    grid: CellTakenBy[][]
  ): Vector2[] {
    const pathfinder = new AStarPathfinder(grid);

    const path = pathfinder.pathfind(from, to);
    if (!path) {
      return []
    }
    return path;
  }

  public static deleteTempWire(
    id: string,
    renderManager: RenderManager
  ) {
    renderManager.rmvRenderable(id);
  }
}