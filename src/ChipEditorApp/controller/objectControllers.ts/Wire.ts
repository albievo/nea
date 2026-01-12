import { AStarPathfinder } from "../../../utils/pathfinding/AStarPathfinder";
import { Vector2 } from "../../../utils/Vector2";
import { CellTakenBy } from "../../model/WorkingChip";

export class Wire {
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
}