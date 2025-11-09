import { Connection } from "./Connection";
import { ChipBehaviour } from "./ChipBehaviour";
import { OutputPin, InputPin } from "./Pins";
import { Value } from "./Value";
import { Queue } from "../utils/Queue";

export class Netlist {
  private nodes: NetlistNode[];
  private connections: Connection[];

  private inputNum = 0;
  private outputNum = 0;

  private MAX_ITERATIONS = 1000;

  //non-canonical tables to speed up lookups
  private outputIndex = new Map<OutputPin, Connection[]>;
  private inputIndex = new Map<InputPin, Connection>;

  private inputNodeIds: string[] = [];
  private outputNodeIds: string[] = [];

  private nodesById = new Map<string, NetlistNode>();
  private connectionsById = new Map<string, Connection>;

  constructor(nodes: NetlistNode[], connections: Connection[]) {
    this.nodes = nodes;
    this.connections = connections;

    // add nodes to helper tables
    nodes.forEach((node) => {
      const error = this.validateNewNode(node);
      if (error) {
        throw new Error(error);
      }
      this.addNodeToNonCanonicalTables(node);
    })

    // add connections to helper tables
    this.connections.forEach((connection) => {
      const error = this.validateNewConnection(connection);
      if (error) {
        throw new Error(error);
      }
      this.addConnectionToNonCanonicalTables(connection);
    });
  }

  public addConnection(connection: Connection): void {
    const error = this.validateNewConnection(connection);
    if (error) {
      throw new Error(error);
    }

    this.connections.push(connection);
    this.addConnectionToNonCanonicalTables(connection);
  }

  private addConnectionToNonCanonicalTables(connection: Connection) {
    this.connectionsById.set(connection.getId(), connection);
    this.addConnectionToOutputIndex(connection);
    this.addConnectionToInputIndex(connection);
  }

  /**
   * call BEFORE adding the new connection
   * */ 
  private validateNewConnection(connection: Connection): string | null {
    const id = connection.getId();
    const from = connection.getFrom();
    const to = connection.getTo();

    const existing = this.connectionsById.get(id);
    if (existing) return `connection with id ${id} already exists`;

    const fromNode = this.nodesById.get(from.nodeId);
    if (!fromNode) return `node with id ${from.nodeId} does not exist`;

    const fromPinExists = from.outputIdx < fromNode.getOutputNum();
    if (!fromPinExists) return `node with id ${from.nodeId} only has ${fromNode.getOutputNum()} outputs, but the connection is reffering to output of index ${from.outputIdx}`;

    const toNode = this.nodesById.get(to.nodeId);
    if (!toNode) return `node with id ${to.nodeId} does not exist`;

    const toPinExists = to.inputIdx < toNode.getInputNum();
    if (!toPinExists) return `node with id ${to.nodeId} only has ${fromNode.getInputNum()} inputs, but the connection is reffering to input of index ${to.inputIdx}`;

    const toPinTakenBy = this.inputIndex.get(to);
    if (toPinTakenBy) return `to pin is already taken by connection with id ${toPinTakenBy.getId()}`;

    return null;
  }

  private addConnectionToOutputIndex(connection: Connection): void {
    const existing = this.outputIndex.get(connection.getFrom());

    // if there is already a connection from an output, add it to the list of connections
    if (existing) {
      existing.push(connection);
      return;
    }

    // otherwise, create a new entry for that output
    this.outputIndex.set(connection.getFrom(), [connection]);
  }
  private addConnectionToInputIndex(connection: Connection): void {
    const existing = this.inputIndex.get(connection.getTo());

    // if there is already a connection to the input, throw an error
    if (existing) {
      throw new Error("Input pin already has a connection");
    }

    // otherwise, create a new entry for that output
    this.inputIndex.set(connection.getTo(), connection);
  }

  public addNode(node: NetlistNode): void {
    const error = this.validateNewNode(node);
    if (error) {
      throw new Error(error);
    }

    this.nodes.push(node);
    this.addNodeToNonCanonicalTables(node);
  }

  private validateNewNode(node: NetlistNode): string | null {
    const existing = this.nodesById.get(node.getId());
    if (existing) return `node with id ${node.getId()} already exists`;

    return null;
  }

  private addNodeToNonCanonicalTables(node: NetlistNode) {
    const nodeId = node.getId();
    const nodeType = node.getType();

    this.nodesById.set(nodeId, node);

    if (nodeType === NodeType.INPUT) {
      this.inputNodeIds.push(nodeId);
      this.inputNum += 1;
    }
    else if (nodeType === NodeType.OUTPUT) {
      this.outputNodeIds.push(nodeId);
      this.outputNum += 1;
    };
  }

  public getInputNum(): number {
    return this.inputNum;
  }
  public getOutputNum(): number {
    return this.outputNum;
  }

  public evaluate(input: Value[]): NetlistOutput {
    if (input.length !== this.inputNum) {
      throw new Error(`input is of length ${input.length} when it should be of ${this.inputNum}`);
    } 

    // create output value array
    const outputVals = Array(this.outputNum).fill(Value.X);
    // reset all stored values
    this.nodes.forEach((node) => {
      node.resetInputOutputVals();
    });

    // create signal queue
    const signalQueue = new Queue<Signal>();

    // add all signals from input elements to the queue
    this.inputNodeIds.forEach((nodeId, idx) => {

      const connections = this.outputIndex.get({
        nodeId: nodeId,
        outputIdx: 0
      });

      connections?.forEach(connection => {
        connection.createSignal(input[idx]);
      });
    });

    let iterations = 0;

    // main loop
    while (iterations < this.MAX_ITERATIONS) {
      iterations += 1;

      const currentSignal = signalQueue.dequeue();

      // if the signal queue is empty, meaning the algorithm has been completed succesfully
      if (!currentSignal) {
        return {
          outputValues: outputVals,
          returnReason: 'stable'
        }
      };

      // the node that the current signal is going to
      const currentSignalToNode = this.nodesById.get(currentSignal.to.nodeId);
      if (!currentSignalToNode) {
        throw new Error(`node with id ${currentSignal.to.nodeId} is attempting to be reached by a signal, but it does not exist`);
      }

      // used to compare whether there has been a change
      const oldOutputs = currentSignalToNode.getOutputs();

      // this will update the outputs automatically
      currentSignalToNode.setInputVal(currentSignal.to.inputIdx, currentSignal.value);

      if (currentSignalToNode.getType() === NodeType.OUTPUT) {
        const outputIdx = this.outputNodeIds.findIndex(
          output => output === currentSignal.to.nodeId
        );

        if (outputIdx === -1) {
          throw new Error("signal is trying to get to an output that doesn't exist");
        }

        outputVals[outputIdx] = currentSignal.value;
      }
      
      const newOutputs = currentSignalToNode.getOutputs();

      newOutputs.forEach((value, idx) => {
        // if the output is the same, dont send a signal
        if (value === oldOutputs[idx]) {
          return;
        }

        // get all the connections from this output
        const connections = this.outputIndex.get({
          nodeId: currentSignal.to.nodeId,
          outputIdx: idx
        });

        if (!connections) {
          return;
        }

        connections.forEach(connection => {
          signalQueue.enqueue(connection.createSignal(value));
        })
      })
    }

    return {
      outputValues: outputVals,
      returnReason: 'max_iterations'
    }
  }
}

export class NetlistNode {
  private id: string;
  private type: NodeType;

  private inputPins: number;
  private outputPins: number;

  private inputVals: Value[];
  private outputVals: Value[];

  private chipBehaviour?: ChipBehaviour;
  
  constructor(id: string, type: NodeType, chipBehaviour?: ChipBehaviour) {
    this.id = id;
    this.type = type;
    this.chipBehaviour = chipBehaviour;

    if (this.type === NodeType.INPUT) {
      this.inputPins = 0;
      this.outputPins = 1;
    }
    else if (this.type === NodeType.OUTPUT) {
      this.inputPins = 1;
      this.outputPins = 0;
    }
    else if (this.type === NodeType.CHIP && this.chipBehaviour) {
      this.inputPins = this.chipBehaviour.inputs;
      this.outputPins = this.chipBehaviour.outputs;
    }
    else {
      throw new Error("Nodes with behaviour type CHIP must have a chipBehaviour");
    }

    this.inputVals = Array(this.inputPins).fill(Value.X);
    this.outputVals = Array(this.outputPins).fill(Value.X);
  }

  public getId() {
    return this.id;
  }
  public getType() {
    return this.type;
  }
  public getInputNum() {
    return this.inputPins;
  }
  public getOutputNum() {
    return this.outputPins;
  }

  public resetInputOutputVals() {
    this.inputVals = Array(this.inputPins).fill(Value.X);
    this.outputVals = Array(this.outputPins).fill(Value.X);
  }

  public setInputVal(inputIdx: number, value: Value) {
    this.inputVals[inputIdx] = value;

    // update outputs if need be
    if (this.type == NodeType.CHIP) {
      this.outputVals = this.chipBehaviour!.evaluate(this.inputVals);
    }
  }

  public getOutputVal(outputIdx: number): Value {
    return this.outputVals[outputIdx];
  }
  public getOutputs(): Value[] {
    return this.outputVals;
  }
}

export enum NodeType {
  INPUT,
  OUTPUT,
  CHIP
}

export interface nodeSummary {
  nodeType: NodeType,
  chipBehaviour?: ChipBehaviour
}

interface NetlistOutput {
  outputValues: Value[],
  returnReason: 'max_iterations' | 'stable'
}

export interface Signal {
  value: Value,
  from: OutputPin,
  to: InputPin
}