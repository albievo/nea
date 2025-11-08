import { PrimitiveBehaviour } from '../../src/netlist/ChipBehaviour';
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
    const orBehaviour = new PrimitiveBehaviour('and');

    expect(
      orBehaviour.evaluate([Value.ONE, Value.ONE])[0]
    ).toEqual(Value.ONE);
    expect(
      orBehaviour.evaluate([Value.ZERO, Value.ONE])[0]
    ).toEqual(Value.ONE);
    expect(
      orBehaviour.evaluate([Value.ONE, Value.ZERO])[0]
    ).toEqual(Value.ONE);
    expect(
      orBehaviour.evaluate([Value.ZERO, Value.ZERO])[0]
    ).toEqual(Value.ZERO);
    expect(
      orBehaviour.evaluate([Value.ONE, Value.X])[0]
    ).toEqual(Value.X);
  })
})