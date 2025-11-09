import { Netlist, NetlistNode, NodeType } from "../../src/netlist/Netlist";
import { ChipBehaviour, PrimitiveBehaviour } from "../../src/netlist/ChipBehaviour";
import { Connection } from "../../src/netlist/Connection";
import { nodeSummary } from "../../src/netlist/Netlist";

import { randomUUID } from "crypto";


describe("setting up netlist", () => {
  test('netlist is created properly', () => {

    const nodeIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];

    const netlist = new Netlist([
      new NetlistNode(
        nodeIds[0],
        NodeType.INPUT
      ),
      new NetlistNode(
        nodeIds[1],
        NodeType.INPUT
      ),
      new NetlistNode(
        nodeIds[2],
        NodeType.CHIP,
        new PrimitiveBehaviour('and')
      ),
      new NetlistNode(
        nodeIds[3],
        NodeType.CHIP,
        new PrimitiveBehaviour('not')
      ),
      new NetlistNode(
        nodeIds[4],
        NodeType.OUTPUT
      )
    ], [
      {
        id: randomUUID(),
        from: {
          nodeId: nodeIds[0],
          outputIdx: 0
        },
        to: {
          nodeId: nodeIds[2],
          inputIdx: 0
        }
      },
      {
        id: randomUUID(),
        from: {
          nodeId: nodeIds[1],
          outputIdx: 0
        },
        to: {
          nodeId: nodeIds[2],
          inputIdx: 1
        }
      },
      {
        id: randomUUID(),
        from: {
          nodeId: nodeIds[2],
          outputIdx: 0
        },
        to: {
          nodeId: nodeIds[3],
          inputIdx: 0
        }
      },
      {
        id: randomUUID(),
        from: {
          nodeId: nodeIds[3],
          outputIdx: 0
        },
        to: {
          nodeId: nodeIds[4],
          inputIdx: 0
        }
      }
    ]);

    expect(netlist.getInputNum()).toEqual(2);
    expect(netlist.getOutputNum()).toEqual(1);
  });

  test('netlist verifies connections properly', () => {
    const netlist = new Netlist([], []);

    expect(() => {
      netlist.addConnection({
        id: randomUUID(),
        from: {
          nodeId: randomUUID(),
          outputIdx: 0
        },
        to: {
          nodeId: randomUUID(),
          inputIdx: 0
        }
      })
    }).toThrow();
  })

  test('netlist adds input/output properly', () => {
    const netlist = new Netlist([], []);

    netlist.addNode(new NetlistNode(randomUUID(), NodeType.INPUT));
    expect(netlist.getInputNum()).toEqual(1);
  })

  test('netlist verifies new nodes properly', () => {
    const nodeId = randomUUID();

    const netlist = new Netlist([
      new NetlistNode(nodeId, NodeType.INPUT)
    ], []);

    expect(() => {
      netlist.addNode(
        new NetlistNode(nodeId, NodeType.CHIP, new PrimitiveBehaviour('and'))
      )
    }).toThrow();
  })
})