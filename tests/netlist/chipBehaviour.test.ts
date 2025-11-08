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