import { Value } from "../netlist/Value";

export type PrimitiveType = keyof typeof primitiveInformation;

export const primitiveInformation = {
  "not": {
    evaluteFunction: (input: Value[]) => {
      if (input.length !== 1) {
        throw new Error("not gate must have exactly 1 input");
      };
      return [Value.negate(input[0])];
    },
    inputs: 1,
    outputs: 1
  },

  "and": {
    // if any 0 => 0; if all 1 => 1; else X
    evaluteFunction: (input: Value[]) => {
      if (input.length !== 2) {
        throw new Error("and gate must have exactly 2 inputs");
      };

      const [a, b] = input;
      
      if (a === Value.ZERO || b === Value.ZERO) return [Value.ZERO];
      if (a === Value.ONE && b === Value.ONE) return [Value.ONE];

      return [Value.X];
    },
    inputs: 2,
    outputs: 1
  },

  "nand": {
    // NAND: if any 0 => 1; if all 1 => 0; else X
    evaluteFunction: (input: Value[]): Value[] => {
      if (input.length !== 2) {
        throw new Error("nand gate must have exactly 2 inputs");
      };

      const [a, b] = input;
      
      if (a === Value.ZERO || b === Value.ZERO) return [Value.ONE];
      if (a === Value.ONE && b === Value.ONE) return [Value.ZERO];

      return [Value.X];
    },
    inputs: 2,
    outputs: 1
  },

  "or": {
    evaluteFunction: (input: Value[]): Value[] => {
      if (input.length !== 2) {
        throw new Error("or gate must have exactly 2 inputs");
      };

      const [a, b] = input;
      
      if (a === Value.ONE || b === Value.ONE) return [Value.ONE];
      if (a === Value.ZERO && b === Value.ZERO) return [Value.ZERO];

      return [Value.X];
    },
    inputs: 2,
    outputs: 1
  }
} satisfies Record<string, {
  evaluteFunction: (input: Value[]) => Value[],
  inputs: number,
  outputs: number
}>