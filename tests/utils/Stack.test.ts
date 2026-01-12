import { Stack } from "../../src/utils/Stack";

test('stack adds and removes correctly', () => {
  const stack = new Stack<number>(100);
  stack.push(1);
  stack.push(2);
  expect(stack.pop()).toEqual(2);
  stack.push(3);
  expect(stack.pop()).toEqual(3);
  expect(stack.pop()).toEqual(1);
})

test('stack correctly reaches max size', () => {
  
})