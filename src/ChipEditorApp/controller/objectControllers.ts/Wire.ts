import { AStarPathfinder } from "../../../utils/pathfinding/AStarPathfinder";
import { Vector2 } from "../../../utils/Vector2";
import { CellTakenBy } from "../../model/WorkingChip";
import { AvailabilityOverlay } from "../../rendering/RenderManager";

export class Wire {
  public static computePath(
    from: Vector2, to: Vector2,
    grid: CellTakenBy[][], overlay: AvailabilityOverlay
  ): Vector2[] {
    const pathfinder = new AStarPathfinder(grid, overlay);

    const path = pathfinder.pathfind(from, to);
    if (!path) {
      return []
    }
    return path;
  }
}