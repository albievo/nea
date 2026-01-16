import { randomUUID } from 'crypto';
import { PrimitiveBehaviour, TruthtableBehaviour } from '../../src/ChipEditorApp/model/netlist/ChipBehaviour';
import { Connection } from '../../src/ChipEditorApp/model/netlist/Connection';
import { Netlist, NetlistNode, NodeType } from '../../src/ChipEditorApp/model/netlist/Netlist';
import { Value } from '../../src/ChipEditorApp/model/netlist/Value';

describe('primitives behave as intended', () => {
  test('and primitives behaves as intended', () => {
    const andBehaviour = new PrimitiveBehaviour('and');

    expect(
      andBehaviour.evaluate([Value.ZERO, Value.ZERO])[0]
    ).toEqual(Value.ZERO);
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

  test('not primitives behaves as intended', () => {
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

  test('or primitives behaves as intended', () => {
    const orBehaviour = new PrimitiveBehaviour('or');

    expect(
      orBehaviour.evaluate([Value.ZERO, Value.ZERO])[0]
    ).toEqual(Value.ZERO);
    expect(
      orBehaviour.evaluate([Value.ZERO, Value.ONE])[0]
    ).toEqual(Value.ONE);
    expect(
      orBehaviour.evaluate([Value.ZERO, Value.X])[0]
    ).toEqual(Value.X);
    expect(
      orBehaviour.evaluate([Value.X, Value.ONE])[0]
    ).toEqual(Value.ONE);
  })
})

describe('truthtable behaves as intended', () => {
  test('truthtable is correctly generated with 1 output', () => {
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
    
    expect(nand_truthtable[0]).toEqual(TruthtableBehaviour.buildTruthtable(
      nand_netlist, new Map<number, string>([
        [0, nodeIds[0]],
        [1, nodeIds[1]]
      ])
    )[0]);
  })

  test('truthtable is correctly evaluated with 1 output', () => {
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
    ).toEqual(Value.ZERO);
  })

  test('truthtable is correctly generated with 2 outputs', () => {
    const nodeIds = [
      randomUUID(), // input 1
      randomUUID(), // input 2
      randomUUID(), // and gate
      randomUUID(), // or gate
      randomUUID(), // and output
      randomUUID()  // or output
    ];

    const and_or_netlist = new Netlist([
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
        new PrimitiveBehaviour('or')
      ),
      new NetlistNode(
        nodeIds[4],
        NodeType.OUTPUT
      ),
      new NetlistNode(
        nodeIds[5],
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
          nodeId: nodeIds[0],
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
          nodeId: nodeIds[1],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[3],
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
      ),
        new Connection(
        randomUUID(),
        {
          nodeId: nodeIds[3],
          outputIdx: 0
        },
        {
          nodeId: nodeIds[5],
          inputIdx: 0
        }
      )
    ]);

    const and_or_truthtable = [parseInt('00010111000000000000000000000000', 2)];

    expect(and_or_truthtable[0]).toEqual(TruthtableBehaviour.buildTruthtable(
      and_or_netlist, new Map<number, string>([
        [0, nodeIds[0]],
        [1, nodeIds[1]]
      ])
    )[0]);
  })

  test('truthtable is correctly evaluated with 2 outputs', () => {
    const and_or_truthtable = new TruthtableBehaviour([parseInt('00010111000000000000000000000000', 2)], 2, 2);

    const zero_zero = and_or_truthtable.evaluate([Value.ZERO, Value.ZERO])
    expect(zero_zero[0])
      .toEqual(Value.ZERO);
    expect(zero_zero[1])
      .toEqual(Value.ZERO);

    const zero_one = and_or_truthtable.evaluate([Value.ZERO, Value.ONE])
    expect(zero_one[0])
      .toEqual(Value.ZERO);
    expect(zero_one[1])
      .toEqual(Value.ONE);

    const one_zero = and_or_truthtable.evaluate([Value.ONE, Value.ZERO]);
    expect(one_zero[0])
      .toEqual(Value.ZERO);
    expect(one_zero[1])
      .toEqual(Value.ONE);

    const one_one = and_or_truthtable.evaluate([Value.ONE, Value.ONE])
    expect(one_one[0])
      .toEqual(Value.ONE);
    expect(one_one[1])
      .toEqual(Value.ONE);
  })

  test('truthtable is correctly evaluated across words', () => {
    const truthtableBehaviour = new TruthtableBehaviour(
      [
        parseInt('00000000000000000000000010000000', 2),
        parseInt('00000000000000010000000000000000', 2),
        parseInt('00000000000000000000000000000000', 2)
      ],
      2,
      24
    )

    const outputAtZeroOne = truthtableBehaviour.evaluate([Value.ZERO, Value.ONE])
    expect(outputAtZeroOne[0]).toEqual(Value.ONE);
    expect(outputAtZeroOne[23]).toEqual(Value.ONE);

    for (let idx = 1; idx < 23; idx++) {
      expect(outputAtZeroOne[idx]).toEqual(Value.ZERO);
    }
  })
})