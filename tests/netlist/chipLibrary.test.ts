import { NetlistBehaviour, PrimitiveBehaviour } from "../../src/editor/model/chip/ChipBehaviour";
import { ChipLibrary } from "../../src/editor/model/chip/ChipLibrary"
import { Connection } from "../../src/editor/model/netlist/Connection";
import { Netlist, NetlistNode, NodeType } from "../../src/editor/model/netlist/Netlist";
import { randomUUID } from "crypto";

test('finding an equivalent static primitive works', () => {
  const chipLibrary = new ChipLibrary();
  chipLibrary.register({
    name: 'nand',
    id: 'nand',
    behaviourSpec: {
      kind: 'primitive',
      type: 'nand'
    },
    inputs: 2,
    outputs: 1,
    icon: 'assets/images/nand-gate.png'
  });

    const nodeIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];

    const nandNetlist = new Netlist([
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
      new Connection(
        randomUUID(),
        {
          nodeId: nodeIds[0],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[2],
          inputIdx: 0
        }
      ),
      new Connection(
        randomUUID(),
        {
          nodeId: nodeIds[1],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[2],
          inputIdx: 1
        }
      ),
      new Connection(
        randomUUID(),
        {
          nodeId: nodeIds[2],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[3],
          inputIdx: 0
        }
      ),
      new Connection(
        randomUUID(),
        {
          nodeId: nodeIds[3],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[4],
          inputIdx: 0
        }
      )
    ]);
    
    let eq = chipLibrary.findEquivalentStaticPrimitive(nandNetlist);
    expect(eq).toBe('nand');

    const andNetlist = new Netlist([
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
        nodeIds[4],
        NodeType.OUTPUT
      )
    ], [
      new Connection(
        randomUUID(),
        {
          nodeId: nodeIds[0],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[2],
          inputIdx: 0
        }
      ),
      new Connection(
        randomUUID(),
        {
          nodeId: nodeIds[1],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[2],
          inputIdx: 1
        }
      ),
      new Connection(
        randomUUID(),
        {
          nodeId: nodeIds[2],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[4],
          inputIdx: 0
        }
      )
    ]);

    eq = chipLibrary.findEquivalentStaticPrimitive(andNetlist);

    expect(eq).toBe(undefined);
})