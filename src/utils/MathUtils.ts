import { Vector2 } from "./Vector2"

export class MathUtils {
  public static calcDistBetweenPoints(a: Vector2, b: Vector2) {
    return Math.sqrt(
      (a.x - b.x)**2 + 
      (a.y - b.y)**2
    )
  }
}