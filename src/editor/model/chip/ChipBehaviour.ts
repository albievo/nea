import { GeneralUtils } from "../../../utils/GeneralUtils";
import { Netlist } from "../netlist/Netlist";
import { Value } from "../netlist/Value";
import { PrimitiveType, primitiveInformation } from "./primitives";

export abstract class ChipBehaviour {
  abstract kind: string;

  abstract inputs: number;
  abstract outputs: number;

  abstract evaluate(inputs: Value[]): Value[];
  abstract isStatic();

  protected generateXOutput() {
    return Array.from({ length: this.outputs }, () => Value.X)
  }

  protected static addIdsToInputs(inputs: Value[], idxToInputId: Map<number, string>):  Map<string, Value> {
    const map = new Map<string, Value>();

    for (let inputIdx = 0; inputIdx < inputs.length; inputIdx++) {
      if (!idxToInputId.has(inputIdx)) {
        throw new Error(`not provided with an input id for input idx ${inputIdx}`);
      }

      const inputId = idxToInputId.get(inputIdx)!;
      map.set(inputId, inputs[inputIdx]);
    }

    return map;
  }
}

export class PrimitiveBehaviour extends ChipBehaviour {
  kind = "primitive";
  private primitiveId: string;

  readonly inputs: number;
  readonly outputs: number;

  readonly static: boolean;

  private evaluationFunction: (input: Value[]) => Value[];

  constructor(primitiveId: PrimitiveType) {
    super();
    this.primitiveId = primitiveId;

    const chipInfo = primitiveInformation[primitiveId];
    if (!chipInfo) {
      throw new Error(`primitive id ${this.primitiveId} does not have a built in behaviour`)
    }

    this.evaluationFunction = chipInfo.evaluteFunction;
    this.inputs = chipInfo.inputs;
    this.outputs = chipInfo.outputs;
    this.static = chipInfo.static
  }

  evaluate(inputs: Value[]): Value[] {
    return this.evaluationFunction(inputs);
  }

  isStatic() {
    return this.static;
  }
}

export class TruthtableBehaviour extends ChipBehaviour {
  kind = "truthtable";
  private truthtable: Uint32Array;

  readonly inputs: number;
  readonly outputs: number;

  constructor(truthtable: Uint32Array, inputNum: number, outputNum: number) {
    super();
    this.truthtable = truthtable;
    this.inputs = inputNum;
    this.outputs = outputNum;
  }

  evaluate(inputs: Value[]): Value[] {
    let outputStartPos = 0;
    const output = this.generateXOutput();
    
    for (let inputIdx = 0; inputIdx < inputs.length; inputIdx++) {
      const input = inputs[inputIdx];
      if (input === Value.X) return this.generateXOutput();

      const bit = input === Value.ONE ? 1 : 0

      outputStartPos = (outputStartPos << 1) | bit;
    }
    
    outputStartPos *= this.outputs;
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
  static buildTruthtable(
    netlist: Netlist,
    idxToInputId: Map<number, string>,
    idToOutputIdx: Map<string, number>
  ): Uint32Array {
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

    for (let inputDecimal = 0; inputDecimal < rows; inputDecimal++) {
      // get input array
      const inputs = makeInputs(inputDecimal, inputNum);
      // get output array
      const inputsWithIds = NetlistBehaviour.addIdsToInputs(inputs, idxToInputId);
      const outputs = netlist.evaluate(inputsWithIds).outputValues;

      // iterate through output array
      for (const [outputId, outputIdx] of idToOutputIdx) {
        // convert value to bit
        const bit = outputs.get(outputId) === Value.ONE
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

  isStatic() {
    return true;
  }
}

export class NetlistBehaviour extends ChipBehaviour {
  kind = "netlist";

  readonly inputs: number;
  readonly outputs: number;

  private static?: boolean;

  private idxToInputId: Map<number, string>;
  private idToOutputIdx: Map<string, number>;

  constructor(
    private netlist: Netlist, 
    idxToInputId?: Map<number, string>,
    idToOutputIdx?: Map<string, number>
  ) {
    super();

    this.inputs = this.netlist.getInputNum();
    this.outputs = this.netlist.getOutputNum();

    this.idxToInputId = idxToInputId ?? netlist.generateDefaultIdxToInputId();
    this.idToOutputIdx = idToOutputIdx ?? netlist.generateDefaultIdToOutputIdx();
  }

  evaluate(inputs: Value[]): Value[] {
    const inputsWithIds = NetlistBehaviour.addIdsToInputs(inputs, this.idxToInputId);

    // currently ignores output reason.
    // Could maybe do something if due to max iteration? 
    // but not super important
    const outputValues = this.netlist.evaluate(inputsWithIds).outputValues;
    const valueArr = Array.from({ length: this.outputs }, () => Value.X);
    for (const [id, val] of outputValues) {
      const outputIdx = this.idToOutputIdx.get(id);
      valueArr[outputIdx] = val;
    }

    return valueArr;
  }

  isStatic() {
    if (this.static === undefined) {
      this.static = this.netlist.isStatic();
    }
    
    return this.static
  }
}

/**
 * max inputs: 20 (otherwise would take too long)
 * 
 * only works on static behaviours
 */
export function checkStaticBehavioursAreEquivalent(a: ChipBehaviour, b: ChipBehaviour) {
  if ( // if one isn't static, just say they arent equivalent
    !a.isStatic() || !b.isStatic()
  ) {
    return false
  }
  if (
    a.inputs !== b.inputs ||
    a.outputs !== b.outputs
  ) {
    return false;
  }

  for (let inputDecimal = 0; inputDecimal < 2**a.inputs; inputDecimal++) {
    // get input array
    const inputArr = makeInputs(inputDecimal, a.inputs);

    // check they have the same output
    if (!GeneralUtils.arraysAreEqual(
      a.evaluate(inputArr), b.evaluate(inputArr)
    )) {
      return false;
    }
  }

  return true;
}

/**
 * convert a decimal representation of the binary input to an array of values
 * @param inputDecimal the decminal representing the input
 * @param inputNum the total number of inputs to the behaviour
 */
function makeInputs(inputDecimal: number, inputNum: number): Value[] {
  const arr = new Array<Value>(inputNum);
  
  for (let input = 0; input < inputNum; input++) {
    arr[input] = Value.fromBool(((inputDecimal >> input) & 1) === 1);
  }

  return arr;
}