import { Vector2 } from "./Vector2"

export class MathUtils {
  public static calcDistBetweenPoints(a: Vector2, b: Vector2) {
    return Math.sqrt(
      (a.x - b.x)**2 + 
      (a.y - b.y)**2
    )
  }

  public static getPerpVectorWithLength(v: Vector2, l: number) {
    const originalMagnitude = Math.sqrt(v.x**2 + v.y**2)

    return new Vector2(
      -v.y * l / originalMagnitude,
      v.x * l / originalMagnitude
    )
  }

  public static getPerpVector(v: Vector2) {
    return new Vector2(
      -v.y,
      v.x
    )
  }

  public static sortPointsClockwise(points: Vector2[]) {
    const c = this.centroid(points);

    return points.slice().sort((a, b) => {
      const angleA = Math.atan2(a.y - c.y, a.x - c.x);
      const angleB = Math.atan2(b.y - c.y, b.x - c.x);
      return angleA - angleB;
    });
  }

  private static centroid(points: Vector2[]) {
    let c = Vector2.zeroes;
    for (const p of points) {
      c = c.add(p)
    }
    return c.divide(points.length);
  }
}