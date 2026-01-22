import { Netlist, NetlistNode, NodeType } from "../../src/editor/model/netlist/Netlist";
import { PrimitiveBehaviour } from "../../src/editor/model/netlist/ChipBehaviour";
import { Connection } from "../../src/editor/model/netlist/Connection";
import { Value } from "../../src/editor/model/netlist/Value";
import { GeneralUtils } from "../../src/utils/GeneralUtils";

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

    expect(netlist.getInputNum()).toEqual(2);
    expect(netlist.getOutputNum()).toEqual(1);
  });

  test('netlist verifies connections properly', () => {
    const netlist = new Netlist([], []);

    expect(() => {
      netlist.addConnection(new Connection(

        randomUUID(),
        {
          nodeId: randomUUID(),
          outputIdx: 0
        },
        {
          nodeId: randomUUID(),
          inputIdx: 0
        }
      ))
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

describe("evaluating a netlist", () => {
  test("evaluating a static netlist works as intended", () => {
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

    expect(
      GeneralUtils.arraysAreEqual(
        netlist.evaluate(new Map([
          [nodeIds[0], Value.ZERO],
          [nodeIds[1], Value.ZERO],
        ])).outputValues,
        
        [Value.ONE]
      )
    ).toBeTruthy();

    expect(
      GeneralUtils.arraysAreEqual(
        netlist.evaluate(new Map([
          [nodeIds[0], Value.ONE],
          [nodeIds[1], Value.ZERO],
        ])).outputValues,
        
        [Value.ONE]
      )
    ).toBeTruthy();

    expect(
      GeneralUtils.arraysAreEqual(
        netlist.evaluate(new Map([
          [nodeIds[0], Value.ZERO],
          [nodeIds[1], Value.ONE],
        ])).outputValues,
        
        [Value.ONE]
      )
    ).toBeTruthy();

    expect(
      GeneralUtils.arraysAreEqual(
        netlist.evaluate(new Map([
          [nodeIds[0], Value.ONE],
          [nodeIds[1], Value.ONE],
        ])).outputValues,
        
        [Value.ZERO]
      )
    ).toBeTruthy();
  });

  test("evaluating a dynamic netlist works as intended", () => {
    const nodeIds = [
      randomUUID(), // 0: D (input)
      randomUUID(), // 1: WE (input)
      randomUUID(), // 2: NAND_Sprime (nand) -- S' = NAND(D, WE)
      randomUUID(), // 3: NOT_D (not)        -- NOT D
      randomUUID(), // 4: NAND_Rprime (nand) -- R' = NAND(NOT_D, WE)
      randomUUID(), // 5: LATCH_NAND1 (nand) -- Q = NAND(S', Qbar)
      randomUUID(), // 6: LATCH_NAND2 (nand) -- Qbar = NAND(R', Q)
      randomUUID()  // 7: Q (output)
    ];

    const connectionIDs = Array.from({ length: 10 }, () => randomUUID());

    const oneBitRamNetlist = new Netlist([
      // inputs
      new NetlistNode(nodeIds[0], NodeType.INPUT), // D
      new NetlistNode(nodeIds[1], NodeType.INPUT), // WE

      // generate S' = NAND(D, WE)
      new NetlistNode(nodeIds[2], NodeType.CHIP, new PrimitiveBehaviour('nand')),

      // generate NOT D
      new NetlistNode(nodeIds[3], NodeType.CHIP, new PrimitiveBehaviour('not')),

      // generate R' = NAND(NOT_D, WE)
      new NetlistNode(nodeIds[4], NodeType.CHIP, new PrimitiveBehaviour('nand')),

      // cross-coupled NAND latch
      new NetlistNode(nodeIds[5], NodeType.CHIP, new PrimitiveBehaviour('nand')), // LATCH_NAND1
      new NetlistNode(nodeIds[6], NodeType.CHIP, new PrimitiveBehaviour('nand')), // LATCH_NAND2

      // output
      new NetlistNode(nodeIds[7], NodeType.OUTPUT) // Q
    ], [
      // D -> NAND_Sprime input 0
      new Connection(connectionIDs[0],
        { nodeId: nodeIds[0], outputIdx: 0 },
        { nodeId: nodeIds[2], inputIdx: 0 }
      ),

      // WE -> NAND_Sprime input 1
      new Connection(connectionIDs[1],
        { nodeId: nodeIds[1], outputIdx: 0 },
        { nodeId: nodeIds[2], inputIdx: 1 }
      ),

      // D -> NOT_D input 0
      new Connection(connectionIDs[2],
        { nodeId: nodeIds[0], outputIdx: 0 },
        { nodeId: nodeIds[3], inputIdx: 0 }
      ),

      // NOT_D -> NAND_Rprime input 0
      new Connection(connectionIDs[3],
        { nodeId: nodeIds[3], outputIdx: 0 },
        { nodeId: nodeIds[4], inputIdx: 0 }
      ),

      // WE -> NAND_Rprime input 1
      new Connection(connectionIDs[4],
        { nodeId: nodeIds[1], outputIdx: 0 },
        { nodeId: nodeIds[4], inputIdx: 1 }
      ),

      // NAND_Sprime -> LATCH_NAND1 input 0  (S')
      new Connection(connectionIDs[5],
        { nodeId: nodeIds[2], outputIdx: 0 },
        { nodeId: nodeIds[5], inputIdx: 0 }
      ),

      // LATCH_NAND2 (Qbar) -> LATCH_NAND1 input 1  (feedback)
      new Connection(connectionIDs[6],
        { nodeId: nodeIds[6], outputIdx: 0 },
        { nodeId: nodeIds[5], inputIdx: 1 }
      ),

      // NAND_Rprime -> LATCH_NAND2 input 0  (R')
      new Connection(connectionIDs[7],
        { nodeId: nodeIds[4], outputIdx: 0 },
        { nodeId: nodeIds[6], inputIdx: 0 }
      ),

      // LATCH_NAND1 (Q) -> LATCH_NAND2 input 1  (feedback)
      new Connection(connectionIDs[8],
        { nodeId: nodeIds[5], outputIdx: 0 },
        { nodeId: nodeIds[6], inputIdx: 1 }
      ),

      // LATCH_NAND1 (Q) -> Q output node
      new Connection(connectionIDs[9],
        { nodeId: nodeIds[5], outputIdx: 0 },
        { nodeId: nodeIds[7], inputIdx: 0 }
      )
    ]);


    const setTo0 = oneBitRamNetlist.evaluate(new Map([
      [nodeIds[0], Value.ZERO],
      [nodeIds[1], Value.ONE],
    ]));

    expect(setTo0.returnReason).toEqual("stable");
    expect(setTo0.outputValues[0]).toEqual(Value.ZERO);

    const switchOffWrite = oneBitRamNetlist.evaluate(new Map([
      [nodeIds[0], Value.ZERO],
      [nodeIds[1], Value.ZERO],
    ]));

    expect(switchOffWrite.returnReason).toEqual("stable");
    expect(switchOffWrite.outputValues[0]).toEqual(Value.ZERO);

    const holding0 = oneBitRamNetlist.evaluate(new Map([
      [nodeIds[1], Value.ZERO],
      [nodeIds[0], Value.ONE],
    ]));

    expect(holding0.returnReason).toEqual("stable");
    expect(holding0.outputValues[0]).toEqual(Value.ZERO);
  })

  test("evalutating an and netlist works", () => {
    const nodeIds = ['input-1', 'input-2', 'and-chip', 'output']


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
        NodeType.OUTPUT,
      ),
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
    ]);

    netlist.evaluate(new Map([
      [nodeIds[0], Value.ZERO],
      [nodeIds[1], Value.ZERO],
    ]));

    netlist.addConnection(
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
      )
    )

    expect(
      GeneralUtils.arraysAreEqual(
        netlist.evaluate(new Map([
          [nodeIds[0], Value.ZERO],
          [nodeIds[1], Value.ZERO],
        ])).outputValues,
        
        [Value.ZERO]
      )
    ).toBeTruthy();
  })
})