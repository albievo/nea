import { randomUUID } from 'crypto';
import { PrimitiveBehaviour, TruthtableBehaviour } from '../../src/netlist/ChipBehaviour';
import { Connection } from '../../src/netlist/Connection';
import { Netlist, NetlistNode, NodeType } from '../../src/netlist/Netlist';
import { Value } from '../../src/netlist/Value';

describe('primitives behave as intended', () => {
  test('and primitives behaves as intended', () => {
    const andBehaviour = new PrimitiveBehaviour('and');

    expect(
      andBehaviour.evaluate([Value.ONE, Value.ONE])[0]
    ).toEqual(Value.ONE);
    expect(
      andBehaviour.evaluate([Value.ZERO, Value.ONE])[0]
    ).toEqual(Value.ZERO);
    expect(
      andBehaviour.evaluate([Value.ONE, Value.ZERO])[0]
    ).toEqual(Value.ZERO);
    expect(
      andBehaviour.evaluate([Value.ONE, Value.X])[0]
    ).toEqual(Value.X);
  });

  test('or primitives behaves as intended', () => {
    const notBehaviour = new PrimitiveBehaviour('not');

    expect(
      notBehaviour.evaluate([Value.ONE])[0]
    ).toEqual(Value.ZERO);
    expect(
      notBehaviour.evaluate([Value.ZERO])[0]
    ).toEqual(Value.ONE);
    expect(
      notBehaviour.evaluate([Value.X])[0]
    ).toEqual(Value.X);
    expect(() => {
      notBehaviour.evaluate([Value.ZERO, Value.ZERO])[0]
    }).toThrow();
  })
})

describe('truthtable behaves as intended', () => {
  test('truthtable is correctly generated', () => {
    const nodeIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];

    const nand_netlist = new Netlist([
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

    const nand_truthtable = [parseInt('11100000000000000000000000000000', 2)];
    
    expect(nand_truthtable[0]).toEqual(TruthtableBehaviour.buildTruthtable(nand_netlist)[0]);
  })

  test('truthtable is correctly generated', () => {
    const nodeIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];

    const nand_netlist = new Netlist([
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

    const nand_truthtable = [parseInt('11100000000000000000000000000000', 2)];
    const nand_behaviour = new TruthtableBehaviour(nand_truthtable, 2, 1);

    expect(
        nand_behaviour.evaluate([Value.ZERO, Value.ZERO])[0],
      ).toEqual(Value.ONE);

    expect(
        nand_behaviour.evaluate([Value.ONE, Value.ZERO])[0],
      ).toEqual(Value.ONE);

    expect(
        nand_behaviour.evaluate([Value.ZERO, Value.ONE])[0],
      ).toEqual(Value.ONE);

    expect(
      nand_behaviour.evaluate([Value.ONE, Value.ONE])[0],
    ).toEqual(Value.ONE);
  })
})