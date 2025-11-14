import { Netlist } from "./Netlist";
import { Value } from "./Value";

export abstract class ChipBehaviour {
  abstract kind: string;

  abstract inputs: number;
  abstract outputs: number;

  abstract evaluate(inputs: Value[]): Value[];

  protected generateXOutput() {
    return Array.from({ length: this.outputs }, () => Value.X)
  }
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
  private truthtable: number[];

  readonly inputs: number;
  readonly outputs: number;

  constructor(truthtable: number[], inputNum: number, outputNum: number) {
    super();
    this.truthtable = truthtable;
    this.inputs = inputNum;
    this.outputs = outputNum;
  }

  evaluate(inputs: Value[]): Value[] {
    let outputStartPos = 0;
    const output = this.generateXOutput();
    
    inputs.forEach((input, inputIdx) => {
      // if any Xs, return all Xs. Could maybe be improved w/ shortcircuiting?
      if (input === Value.X) return this.generateXOutput();

      const inputBit = input === Value.ONE ? 1 : 0
      if (inputBit) {
        outputStartPos |= 1 << inputIdx
      }
    })

    const outputEndPos = outputStartPos + this.outputs - 1;

    const outputStartWord = Math.floor(outputStartPos / 32);
    const outputEndWord = Math.floor(outputEndPos / 32);

    const outputStartBitIndex = outputStartPos & 31;
    const outputEndBitIndex = outputEndPos & 31;

    let outputIdx = 0;

    for (let wordIdx = outputStartWord; wordIdx <= outputEndWord; wordIdx++) {

      const word = this.truthtable[wordIdx];

      let startBitIndex = 0;
      let endBitIndex = 31;
      if (wordIdx === outputStartWord) startBitIndex = outputStartBitIndex;
      if (wordIdx === outputEndWord) endBitIndex = outputEndBitIndex;

      for (let bitIndex = startBitIndex; bitIndex <= endBitIndex; bitIndex++) {
        // index is from left, offset is from right
        const bitOffset = 31 - bitIndex;
        const bit = (word >>> bitOffset) & 1;
        const value = Value.fromBool(bit === 1);
        output[outputIdx] = value;
        outputIdx += 1;
      }
    }

    return output;
  }

  /**
   * Assumes netlist is static
   */
  static buildTruthtable(netlist: Netlist): Uint32Array {
    const inputNum = netlist.getInputNum();
    const outputNum = netlist.getOutputNum();

    // if would take > 1.25MB 
    if (inputNum > 20) {
      throw new Error('don\'t make a truthtable with more than 20 inputs');
    }

    const rows = 1 << inputNum; // 2^inputNum
    const totalBits = rows * outputNum;
    const words = Math.ceil(totalBits / 32);
    const table = new Uint32Array(words); // initialised as 0s

    function makeInputs(inputDecimal: number): Value[] {
      const arr = new Array<Value>(inputNum);
      
      for (let input = 0; input < inputNum; input++) {
        arr[input] = Value.fromBool(((inputDecimal >> input) & 1) === 1);
      }

      return arr;
    }

    for (let inputDecimal = 0; inputDecimal < rows; inputDecimal++) {
      // get input array
      const inputs = makeInputs(inputDecimal);
      // get output array
      const outputs = netlist.evaluate(inputs).outputValues;

      // iterate through output array
      for (let outputIdx = 0; outputIdx < outputNum; outputIdx++) {
        // convert value to bit
        const bit = outputs[outputIdx] === Value.ONE
          ? 1
          : 0;

        // get the position of the relevant bit
        const bitIndex = inputDecimal * outputNum + outputIdx;
        const wordIndex = bitIndex >>> 5; // divides by 32
        const bitOffset = 31 - (bitIndex & 31); // mod 32

        if (bit) {
          // adds a 1 to the relevant position (>>> 0 just left-fills with 0s)
          table[wordIndex] |= (1 << bitOffset) >>> 0;
        }
      }
    }

    return table;
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
  })

  .set("nand", {
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
  })

  .set("or", {
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
  })