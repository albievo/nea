export enum Value {
  ZERO,
  ONE,
  X
}

export namespace Value {
  export function negate(v: Value): Value {
    switch(v) {
      case Value.ZERO:  return Value.ONE;
      case Value.ONE:   return Value.ZERO;
      case Value.X:     return Value.X;
    }
  }

  export function fromBool(b: boolean): Value {
    return b
      ? Value.ONE
      : Value.ZERO;
  }
}