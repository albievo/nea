export class Vector2 {
  protected x: number;
  protected y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public setX(x: number) {
    this.x = x;
  }
  public setY(y: number) {
    this.y = y;
  }

  public getX(): number {
    return this.x;
  }
  public getY(): number {
    return this.y;
  }

  public add(a: number): Vector2;
  public add(a: Vector2): Vector2;

  public add(a: number | Vector2): Vector2 {
    // for scalar addition
    if (typeof(a) === "number") {
      return new Vector2(this.x + a, this.y + a);
    }
    //for vector addition
    else {
      return new Vector2(this.x + a.getX(), this.y + a.getY());
    }
  }

  public subtract(a: number): Vector2;
  public subtract(a: Vector2): Vector2;

  public subtract(a: number | Vector2): Vector2 {
    // for scalar subtractition
    if (typeof(a) === "number") {
      return new Vector2(this.x - a, this.y - a);
    }
    //for vector subtractition
    else {
      return new Vector2(this.x - a.getX(), this.y - a.getY());
    }
  }

  public copy() {
    return new Vector2(this.x, this.y);
  }

  public incrementXBy(x: number) {
    this.x += x;
  }

  public incrementYBy(y: number) {
    this.y += y;
  }

  public equals(vector: Vector2) {
    return (
      this.x == vector.getX() &&
      this.y == vector.getY()
    )
  }

  public applyFunction(func: (n: number) => number) {
    return new Vector2(
      func(this.x),
      func(this.y)
    );
  }

  public mult(num: number) {
    return new Vector2(this.x * num, this.y * num);
  }

  public divide(num: number) {
    return new Vector2(this.x / num, this.y / num);
  }
}