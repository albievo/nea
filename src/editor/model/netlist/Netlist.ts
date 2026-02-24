import { Connection } from "./Connection";
import { ChipBehaviour } from "../chip/ChipBehaviour";
import { OutputPin, InputPin } from "../chip/Pins";
import { Value } from "./Value";
import { Queue } from "../../../utils/Queue";
import { GeneralUtils } from "../../../utils/GeneralUtils";
import { RenderState } from "../../rendering/RenderManager";
import { createEmptyRenderState } from "../../rendering/RenderState";
import { SerializedNetlist } from "./SerializedNetlist";
import { ChipLibrary, GenericChipDetails, getGenericChipDef } from "../chip/ChipLibrary";
import { createBehaviour } from "../chip/BehaviourSpec";
import { Stack } from "../../../utils/Stack";

export class Netlist {
  private nodes: NetlistNode[];
  private connections: Connection[];

  private inputNum = 0;
  private outputNum = 0;

  private MAX_ITERATIONS = 1000;

  //non-canonical tables to speed up lookups
  // node id -> pinIdx
  private outputIndex = new Map<string, Map<number, Connection[]>>;
  private inputIndex = new Map<string, Map<number, Connection>>;

  private inputNodeIds: string[] = [];
  private outputNodeIds: string[] = [];

  private nodesById = new Map<string, NetlistNode>();
  private connectionsById = new Map<string, Connection>();

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
        throw new Error(`failed to create connection ${connection.getId()}: \n ${error}`);
      }
      this.addConnectionToNonCanonicalTables(connection);
    });
  }

  public addConnection(connection: Connection): void {
    const error = this.validateNewConnection(connection);
    if (error) {
      throw new Error(`failed to create connection ${connection.getId()}: \n ${error}`);
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

    const toPinTakenBy = this.inputIndex
      .get(to.nodeId)
      ?.get(to.inputIdx);
    if (toPinTakenBy) return `to pin is already taken by connection with id ${toPinTakenBy.getId()}`;

    return null;
  }

  private addConnectionToOutputIndex(connection: Connection): void {
    const existing = this.outputIndex
      .get(connection.getFrom().nodeId)
      ?.get(connection.getFrom().outputIdx);

    // if there is already a connection from an output, add it to the list of connections
    if (existing) {
      existing.push(connection);
      return;
    }

    // otherwise, create a new entry for that output
    const nodeMap = new Map<number, Connection[]>()
    nodeMap.set(connection.getFrom().outputIdx, [connection])

    this.outputIndex.set(connection.getFrom().nodeId, nodeMap);
  }
  private addConnectionToInputIndex(connection: Connection): void {
    const existing = this.inputIndex
      .get(connection.getTo().nodeId)
      ?.get(connection.getTo().inputIdx);

    // if there is already a connection to the input, throw an error
    if (existing) {
      throw new Error("Input pin already has a connection");
    }

    // otherwise, create a new entry for that output
    const nodeMap = new Map<number, Connection>()
    nodeMap.set(connection.getTo().inputIdx, connection)

    this.inputIndex.set(connection.getTo().nodeId, nodeMap);
  }

  public addNode(node: NetlistNode): void {
    const error = this.validateNewNode(node);
    if (error) {
      throw new Error(error);
    }

    this.nodes.push(node);
    this.addNodeToNonCanonicalTables(node);
  }

  public rmvNode(id: string): void {
    const node = this.nodesById.get(id);
    if (!node) {
      console.error('no node of this id found');
      return;
    }
    
    // -- remove conections --
    const connectionsIn = this.inputIndex.get(id);
    const connectionsOut = this.outputIndex.get(id);

    if (connectionsIn) {
      for (const connection of connectionsIn.values()) {
        this.rmvConnection(connection.getId());
      }
    }
    if (connectionsOut) {
      for (const connections of connectionsOut.values()) {
        for (const connection of connections) {
          this.rmvConnection(connection.getId());
        }
      }
    }
    this.inputIndex.delete(id);
    this.outputIndex.delete(id);

    // -- remove node from other lookup tables --
    if (node.getType() === NodeType.INPUT) {
      this.inputNum -= 1;
      this.inputNodeIds = GeneralUtils.removeValue(this.inputNodeIds, id);
    }
    if (node.getType() === NodeType.OUTPUT) {
      this.outputNum -= 1;
      this.outputNodeIds = GeneralUtils.removeValue(this.outputNodeIds, id);
    }

    // -- remove node from canonical table --
    this.nodes = this.nodes.filter(
      node => node.getId() !== id
    );
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

  private reset() {
    this.nodes.forEach((node) => {
      node.resetInputOutputVals();
    });
  }

  private enqueueSignalsFromPinWithValue(queue: Queue<Signal>, pin: OutputPin, value: Value): void {
      const connections = this.outputIndex.
        get(pin.nodeId)
        ?.get(pin.outputIdx);

      connections?.forEach(connection => {
        queue.enqueue(connection.createSignal(value));
      });
  }

  public evaluate(input: Map<string, Value>, reset: boolean = false): NetlistOutput {

    const outputsSent = new Map<string, Map<number, boolean>>();

    if (reset) {
      this.reset();
    }

    // create signal queue
    const signalQueue = new Queue<Signal>();
    
    // add all signals from input elements to the queue
    for (const inputId of this.inputNodeIds) {
      if (!input.has(inputId)) {
        throw new Error(`input ${inputId} has not been provided a value`);
      }

      const inputVal = input.get(inputId)!;
      this.nodesById.get(inputId)?.setInputNodeOutputVal(inputVal);

      this.enqueueSignalsFromPinWithValue(
        signalQueue, 
        { nodeId: inputId, outputIdx: 0 },
        inputVal
      );
    }

    let iterations = 0;

    // main loop
    while (iterations < this.MAX_ITERATIONS) {
      iterations += 1;

      const currentSignal = signalQueue.dequeue();

      // if the signal queue is empty, meaning the algorithm has been completed succesfully
      if (!currentSignal) {
        return {
          outputValues: this.getOutputValues(),
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
      
      const newOutputs = currentSignalToNode.getOutputs();
      newOutputs.forEach((value, idx) => {
        const signalsSentFromNode = outputsSent.get(currentSignal.to.nodeId);
        const signalSentFromPin = signalsSentFromNode?.has(idx) ?? false;

        // if the output is the same, and the pin has already sent one signal,
        // dont send another
        if (value === oldOutputs[idx] && signalSentFromPin) {
          return;
        }

        this.enqueueSignalsFromPinWithValue(
          signalQueue,
          { nodeId: currentSignal.to.nodeId, outputIdx: idx },
          value
        )

        // tell outputsSent that we have sent a signal from this node
        if (!signalSentFromPin) {
          const innerMap = signalsSentFromNode ?? new Map<number, boolean>();
          innerMap.set(idx, true);
          outputsSent.set(currentSignal.to.nodeId, innerMap);
        }
      })
    }

    return {
      outputValues: this.getOutputValues(),
      returnReason: 'max_iterations'
    }
  }

  private getOutputValues(): Map<string, Value> {
    return new Map<string, Value>(
      this.outputNodeIds.map((nodeId) => [
        nodeId,
        this.nodesById.get(nodeId)?.getInputVal(0) ?? Value.X
      ])
    )
  }

  public rmvConnection(id: string) {
    const connection = this.connectionsById.get(id);
    if (!connection) return;
    // ---- remove from non-canonical tables ----

    // rmv from connectionsById
    this.connectionsById.delete(id);
    
    //rmv from input index
    const inputToNode = this.inputIndex.get(connection.getTo().nodeId);
    inputToNode?.delete(connection.getTo().inputIdx);

    // set the value that the connection leads to to -1
    const toNode = this.nodesById.get(connection.getTo().nodeId);
    toNode?.setInputVal(connection.getTo().inputIdx, Value.X);

    // rmv from output index
    const outputFromNode = this.outputIndex.get(connection.getFrom().nodeId);
    if (!outputFromNode) return;
    const outputsFromPin = outputFromNode.get(connection.getFrom().outputIdx) ?? [];
    outputFromNode.set(connection.getFrom().outputIdx, outputsFromPin.filter(
      connection => connection.getId() !== id
    ));
    outputFromNode?.delete(connection?.getFrom().outputIdx);

    // ---- remove from canonical table ----
    this.connections = this.connections.filter(
      connection => connection.getId() !== id
    );
  }

  public getConnectionTo(id: string): InputPin | undefined {
    const connection = this.connectionsById.get(id);
    return connection?.getTo();
  }

  public getConnection(id: string): Connection | undefined {
    return this.connectionsById.get(id);
  }

  public getRenderState(): RenderState {
    const state = createEmptyRenderState();

    for (const node of this.nodes) {
      // add input values
      const nodeInputs = new Map<number, Value>();
      for (let inputIdx = 0; inputIdx < node.getInputNum(); inputIdx++) {
        nodeInputs.set(inputIdx, node.getInputVal(inputIdx));
      }
      state.inputPins.set(node.getId(), nodeInputs);

      // add output values
      const nodeOutputs = new Map<number, Value>();
      for (let outputIdx = 0; outputIdx < node.getOutputNum(); outputIdx++) {
        nodeOutputs.set(outputIdx, node.getOutputVal(outputIdx));
      }
      state.outputPins.set(node.getId(), nodeOutputs);

      // add connection values
      for (const connection of this.connections) {
        const connectionFrom = connection.getFrom();
        const connectionFromNode = this.nodesById.get(connectionFrom.nodeId)
        if (!connectionFromNode) continue;

        const value = connectionFromNode.getOutputVal(connectionFrom.outputIdx);
        state.wires.set(connection.getId(), value);
      }
    }

    return state;
  }

  public static fromSerialized(
    serialized: SerializedNetlist,
    chipLibrary: ChipLibrary
  ): Netlist {
    const netlist = new Netlist([], []);

    // add chips to netlist
    for (const chip of serialized.chips) {
      netlist.addNode(new NetlistNode(
        chip.id, chip.details, chipLibrary
      ));
    }

    // add connections to netlist
    for (const connection of serialized.connections) {
      const id = connection.id ?? crypto.randomUUID();

      netlist.addConnection(new Connection(
        id, connection.from, connection.to
      ));
    }
    
    return netlist;
  }

  public serialize(): SerializedNetlist {
    const serialized: SerializedNetlist = { chips: [], connections: [] };

    // node id -> [available inputs, available outputs]
    const nodeIdsToPins = new Map<string, [Set<number>, Set<number>]>();

    for (const node of this.nodes) {
      const inputs = new Set<number>();
      const outputs = new Set<number>();

      for (let i = 0; i < node.getInputNum(); i++) {
        inputs.add(i);
      }

      for (let i = 0; i < node.getOutputNum(); i++) {
        outputs.add(i);
      }

      if (nodeIdsToPins.has(node.getId())) {
        console.error(`multiple nodes with id ${node.getId()}`);
        continue;
      }

      nodeIdsToPins.set(node.getId(), [inputs, outputs]);

      serialized.chips.push(node.serialize());
    }

    for (const connection of this.connections) {
      const id = connection.getId();
      const from = connection.getFrom();
      const to = connection.getTo();

      // check that it is a valid connection

      // check from pin
      const fromPins = nodeIdsToPins.get(from.nodeId);
      if (!fromPins || !fromPins[1].has(from.outputIdx)) {
        console.error(`node with id ${from.nodeId} and output pin ${from.outputIdx} does not exist`);
        continue;
      }

      // check to pin
      const toPins = nodeIdsToPins.get(to.nodeId);
      if (!toPins || !toPins[0].has(to.inputIdx)) {
        console.error(`node with id ${to.nodeId} and input pin ${to.inputIdx} does not exist`);
        continue;
      }
      toPins[0].delete(to.inputIdx);

      serialized.connections.push({ id, from, to });
    }

    return serialized;
  }

  public fullyConnected(): boolean {
    for (let nodeIdx = 0; nodeIdx < this.nodes.length; nodeIdx++) {
      const node = this.nodes[nodeIdx];

      // check inputs are fully connected
      const inputNum = node.getInputNum();
      const inputs = this.inputIndex.get(node.getId()) ?? new Map();

      for (let inputIdx = 0; inputIdx < inputNum; inputIdx++) {
        if (!inputs.has(inputIdx)) {
          return false
        }
      }

      // check outputs are fully connected
      const outputNum = node.getOutputNum();
      const outputs = this.outputIndex.get(node.getId()) ?? new Map();

      for (let output = 0; output < outputNum; output++) {
        if (!outputs.has(output)) {
          return false; // at least one output not connected
        }
      }

      return true; // all outputs connected
    }
  }

  public hasInputAndOutput(): boolean {
    return (
      this.inputNodeIds.length >= 1 &&
      this.outputNodeIds.length >= 1
    )
  }

  /**
   * checks if the netlist is static.
   */
  public isStatic(): boolean {
    // uses DFS to check for any loops or dynamic nodes

    // nodes that have been fully processed
    const done = new Set<string>();
    // nodes that are currently being explored
    const inStack = new Set<string>();

    // use an explicit stack of frames so we can emulate DFS w/out recursion
    // 0 means it is open, 1 means it is due to be closed
    type Frame = { id: string; stage: 0 | 1 };
    const stack = new Stack<Frame>(32_000);

    // iterate through nodes
    for (const [startId] of this.nodesById) {
      if (done.has(startId)) continue;

      stack.push({ id: startId, stage: 0 });

      while (!stack.isEmpty()) {
        // get the next node
        const frame = stack.pop();

        if (frame.stage === 0) {
          if (inStack.has(frame.id)) return false;
          if (done.has(frame.id)) continue;

          const node = this.nodesById.get(frame.id);
          if (!node) continue; // or: return false; if missing nodes should fail
          if (!node.isStatic()) return false;

          inStack.add(frame.id);
          stack.push({ id: frame.id, stage: 1 });

          // push children to be processed
          const nextNodes = this.outputIndex.get(frame.id);
          if (!nextNodes) continue;

          for (const connectionsFromPin of nextNodes.values()) {
            for (const connection of connectionsFromPin) {
              stack.push({ id: connection.getTo().nodeId, stage: 0 });
            }
          }
        } else { // frame stage is 1
          inStack.delete(frame.id);
          done.add(frame.id);
        }
      }
    }

    return true;
  }

  public copy(): Netlist {
    return new Netlist(
      this.nodes.map(node => node.copy()),
      this.connections
    )
  }

  public generateDefaultIdxToInputId(): Map<number, string> {
    const entries: [number, string][] = [];

    for (let i = 0; i < this.getInputNum(); i++) {
      entries.push([i, this.inputNodeIds[i]]);
    }

    return new Map(entries);
  }

  public generateDefaultIdToOutputIdx(): Map<string, number> {
    const entries: [string, number][] = [];

    for (let i = 0; i < this.getOutputNum(); i++) {
      entries.push([this.outputNodeIds[i], i]);
    }

    return new Map(entries);
  }

  public getInputNodes(): string[] {
    return [...this.inputNodeIds];
  }

  public getOutputNodes(): string[] {
    return [...this.outputNodeIds];
  }
}

export class NetlistNode {
  private id: string;
  private type: NodeType;

  private det: GenericChipDetails;
  private chipLibrary: ChipLibrary;

  private inputPins: number;
  private outputPins: number;

  private inputVals: Value[];
  private outputVals: Value[];

  private chipBehaviour?: ChipBehaviour;
  private defId?: string;
  
  constructor(id: string, det: GenericChipDetails, chipLibrary: ChipLibrary) {
    this.id = id;
    this.type = det.type;

    

    if (det.type === NodeType.CHIP) {
      this.chipBehaviour = createBehaviour(
        chipLibrary, chipLibrary.get(det.defId).behaviourSpec
      );

      this.defId = det.defId
    }

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
  public setInputNodeOutputVal(val: Value) {
    if (!(this.type === NodeType.INPUT)) return;
    this.outputVals = [val];
  }

  public getInputVal(inputIdx: number): Value {
    return this.inputVals[inputIdx];
  }


  public getOutputVal(outputIdx: number): Value {
    return this.outputVals[outputIdx];
  }
  public getOutputs(): Value[] {
    return this.outputVals;
  }

  public isStatic(): boolean {
    if (!this.chipBehaviour) {
      return true
    }
    return this.chipBehaviour.isStatic()
  }

  public copy(): NetlistNode {
    return new NetlistNode(
      this.id, this.det, this.chipLibrary
    )
  }

  public serialize(): { id: string, details: GenericChipDetails} {
    return {
      id: this.id,
      details: this.det
    }
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
  outputValues: Map<string, Value>, // node id -> value
  returnReason: 'max_iterations' | 'stable'
}

export interface Signal {
  value: Value,
  from: OutputPin,
  to: InputPin
}