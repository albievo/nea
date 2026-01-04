export class Vector2 {
  private _x: number;
  private _y: number;
  private fixed = false;

  public static zeroes = new Vector2(0, 0, true);

  constructor(x: number, y: number, fixed?: boolean) {
    this._x = x;
    this._y = y;

    this.fixed = fixed || false;
  }

  public set x(x: number) {
    if (this.fixed) {
      throw new Error('cannot edit fixed vectors');
    }
    this._x = x;
  }
  public set y(y: number) {
    if (this.fixed) {
      throw new Error('cannot edit fixed vectors');
    }
    this._y = y;
  }

  public get x(): number {
    return this._x;
  }
  public get y(): number {
    return this._y;
  }

  public add(a: number): Vector2;
  public add(a: Vector2): Vector2;
  public add(a: number, b: number): Vector2;

  public add(a: number | Vector2, b?: number): Vector2 {
    if (typeof(a) === "number") {
      return new Vector2(this.x + a, this.y + (b ?? a));
    }
    else {
      return new Vector2(this.x + a.x, this.y + a.y)
    }
  }

  public subtract(a: number): Vector2;
  public subtract(a: Vector2): Vector2;
  public subtract(a: number, b: number): Vector2;

  public subtract(a: number | Vector2, b?: number): Vector2 {
    // for scalar subtractition
    if (typeof(a) === "number") {
      return new Vector2(this.x - a, this.y - (b ?? a));
    }
    //for vector subtractition
    else {
      return new Vector2(this.x - a.x, this.y - a.y);
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
      this.x == vector.x &&
      this.y == vector.y
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

  public fixedCopy() {
    return new Vector2(this.x, this.y, true);
  }

  public neg() {
    return new Vector2(
      -this.x,
      -this.y
    )
  }

  public toString() {
    return `(${this.x}, ${this.y})`;
  }
}