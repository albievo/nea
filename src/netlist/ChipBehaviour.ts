import { Netlist } from "./Netlist";
import { Value } from "./Value";

export abstract class ChipBehaviour {
  abstract kind: string;

  abstract inputs: number;
  abstract outputs: number;

  abstract evaluate(inputs: Value[]): Value[];
}

export class PrimitiveBehaviour extends ChipBehaviour {
  kind = "primitive";
  private primitiveId: string;

  readonly inputs: number;
  readonly outputs: number;

  private evaluationFunction: (input: Value[]) => Value[];

  constructor(primitiveId: string) {
    super();
    this.primitiveId = primitiveId;

    const chipInfo = primitiveInformation.get(primitiveId);
    if (!chipInfo) {
      throw new Error(`primitive id ${this.primitiveId} does not have a built in behaviour`)
    }

    this.evaluationFunction = chipInfo.evaluteFunction;
    this.inputs = chipInfo.inputs;
    this.outputs = chipInfo.outputs;
  }

  evaluate(inputs: Value[]): Value[] {
    return this.evaluationFunction(inputs);
  }
}

export class TruthtableBehaviour extends ChipBehaviour {
  kind = "truthtable";
  private truthtable: boolean[][];

  readonly inputs: number;
  readonly outputs: number;

  constructor(truthtable: boolean[][]) {
    super();
    this.truthtable = truthtable;
    this.inputs = Math.log2(truthtable.length);
    this.outputs = truthtable[0].length;
  }

  evaluate(inputs: Value[]): Value[] {
    throw new Error("not yet implemented");
    return [Value.X]
  }
}

export class NetlistBehaviour extends ChipBehaviour {
  kind = "netlist";
  private netlist: Netlist;

  readonly inputs: number;
  readonly outputs: number;

  constructor(netlist: Netlist) {
    super();
    this.netlist = netlist;

    this.inputs = this.netlist.getInputNum();
    this.outputs = this.netlist.getOutputNum();
  }

  evaluate(inputs: Value[]): Value[] {
    throw new Error("not yet implemented");
    return [Value.X];
  }
}


const primitiveInformation = new Map<string, {
  evaluteFunction: (input: Value[]) => Value[],
  inputs: number,
  outputs: number
}>()

  .set("not", {
    evaluteFunction: (input: Value[]) => {
    if (input.length !== 1) {
      throw new Error("not gate must have exactly 1 input");
    };
    return [Value.negate(input[0])];
  },
  inputs: 1,
  outputs: 1
  })

  .set("and", {
    evaluteFunction: (input: Value[]) => {
    if (input.length !== 2) {
      throw new Error("and gate must have exactly 2 inputs");
    };

    const [a, b] = input;
    
    if (a === Value.X || b === Value.X) return [Value.X];

    return [Value.fromBool(a === Value.ONE && b === Value.ONE)]
  },
  inputs: 2,
  outputs: 1
  })

  .set("nand", {
    evaluteFunction: (input: Value[]): Value[] => {
      if (input.length !== 2) {
        throw new Error("nand gate must have exactly 2 inputs");
      };

      const [a, b] = input;
      
      if (a === Value.X || b === Value.X) return [Value.X];

      return [Value.fromBool(!(a === Value.ONE && b === Value.ONE))]
    },
    inputs: 2,
    outputs: 1
  })