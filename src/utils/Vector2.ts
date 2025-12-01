export class Vector2 {
  private x: number;
  private y: number;
  private fixed = false;

  public static origin = new Vector2(0, 0, true);

  constructor(x: number, y: number, fixed?: boolean) {
    this.x = x;
    this.y = y;

    this.fixed = fixed || false;
  }

  public setX(x: number) {
    if (this.fixed) {
      throw new Error('cannot edit fixed vectors');
    }
    this.x = x;
  }
  public setY(y: number) {
    if (this.fixed) {
      throw new Error('cannot edit fixed vectors');
    }
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
    return new Vector2(this.x, this.y, this.fixed);
  }

  public incrementXBy(x: number) {
    if (this.fixed) {
      throw new Error('cannot edit fixed vectors');
    }
    this.x += x;
  }

  public incrementYBy(y: number) {
    if (this.fixed) {
      throw new Error('cannot edit fixed vectors');
    }
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