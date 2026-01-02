import { AStarPathfinder } from '../../../src/rendering/pathfinding/AStarPathfinder';
import { CellTakenBy } from '../../../src/rendering/RenderManager';
import { GeneralUtils } from '../../../src/utils/GeneralUtils';
import { Vector2 } from '../../../src/utils/Vector2';

test("correctly identify the shortest path without obstacles", () => {
  const availabilityGrid = GeneralUtils.createMatrixOfVals<CellTakenBy>(() => ({ids: []}), 10, 10);
  const pathfinder = new AStarPathfinder(availabilityGrid);

  let startCell = new Vector2(0, 0);
  let endCell = new Vector2(1, 1);
  let correctPath = [startCell, endCell];
  let calculatedPath = pathfinder.pathfind(startCell, endCell);

  if (calculatedPath === null) {
    expect(calculatedPath).toBeTruthy();
    return;
  }

  expect(calculatedPath.length).toBe(correctPath.length);
  expect(calculatedPath.every((cell, cellIdx) => cell.equals(correctPath[cellIdx]))).toBeTruthy();


  startCell = new Vector2(2, 2);
  endCell = new Vector2(5, 2);
  correctPath = [startCell, new Vector2(3, 2), new Vector2(4, 2), endCell];
  calculatedPath = pathfinder.pathfind(startCell, endCell);

  if (calculatedPath === null) {
    expect(calculatedPath).toBeTruthy();
    return;
  }

  expect(calculatedPath.length).toBe(correctPath.length);
  expect(calculatedPath.every((cell, cellIdx) => cell.equals(correctPath[cellIdx]))).toBeTruthy();


  startCell = new Vector2(7, 8);
  endCell = new Vector2(9, 9);
  let correctPath1 = [startCell, new Vector2(8, 9), endCell];
  let correctPath2 = [startCell, new Vector2(8, 8), endCell];
  calculatedPath = pathfinder.pathfind(startCell, endCell);

  if (calculatedPath === null) {
    expect(calculatedPath).toBeTruthy();
    return;
  }

  expect(calculatedPath.length).toBe(correctPath1.length);
  expect(
    calculatedPath.every((cell, cellIdx) => cell.equals(correctPath1[cellIdx])) ||
    calculatedPath.every((cell, cellIdx) => cell.equals(correctPath2[cellIdx]))
  ).toBeTruthy();
});

test("correctly identify the shortest path with obstacles", () => {
  const availabilityGrid = GeneralUtils.createMatrixOfVals<CellTakenBy>(() => ({ids: []}), 10, 10);
  availabilityGrid[2][2] = {type: 'element', ids: ['1']};

  const pathfinder = new AStarPathfinder(availabilityGrid);

  let startCell = new Vector2(1, 1);
  let endCell = new Vector2(3, 3);
  let correctPath1 = [startCell, new Vector2(2, 1), new Vector2(3, 2), endCell];
  let correctPath2 = [startCell, new Vector2(1, 2), new Vector2(2, 3), endCell];
  let calculatedPath = pathfinder.pathfind(startCell, endCell);

  if (calculatedPath === null) {
    expect(calculatedPath).toBeTruthy();
    return;
  }

  expect(calculatedPath.length).toBe(correctPath1.length);
  expect(
    calculatedPath.every((cell, cellIdx) => cell.equals(correctPath1[cellIdx])) ||
    calculatedPath.every((cell, cellIdx) => cell.equals(correctPath2[cellIdx]))
  ).toBeTruthy();
})