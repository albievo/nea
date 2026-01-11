import { AStarNode } from "./AStarNode";
import { MathUtils } from "../../../utils/MathUtils";
import { Vector2 } from "../../../utils/Vector2";
import { GeneralUtils } from "../../../utils/GeneralUtils";
import { CellTakenBy } from "../../model/WorkingChip";

export class AStarPathfinder {
  private height: number
  private width: number;

  private availabilityGrid: CellTakenBy[][];

  private adjacentRelations = [
    new Vector2(-1, -1),
    new Vector2(0, -1),
    new Vector2(1, -1),
    new Vector2(-1, 0),
    new Vector2(1, 0),
    new Vector2(-1, 1),
    new Vector2(0, 1),
    new Vector2(1, 1),
  ]

  constructor(availibilyGrid: CellTakenBy[][]) {
    this.height = availibilyGrid.length;
    this.width = availibilyGrid[0].length;

    this.availabilityGrid = availibilyGrid;
  }

  public updateAvailabilityGrid(availabilityGrid: CellTakenBy[][]) {
    this.availabilityGrid = availabilityGrid;
  }

  public pathfind(startCell: Vector2, endCell: Vector2): Vector2[] | null {
    if (
      !this.cellIsAvailable(startCell) ||
      !this.cellIsAvailable(endCell)
    )
    {
      throw new Error('start or end cell is occupied, so cannot pathfind.');
    }

    const distToEnd = MathUtils.calcDistBetweenPoints(startCell, endCell);
    const openNodes = [new AStarNode(startCell, 0, distToEnd)];
    const closedGrid = GeneralUtils.createMatrixOfVals<AStarNode | undefined>(() => undefined, this.height, this.width);

    // while there are still cells to check
    while (openNodes.length >= 1) {
      const smallestValueIdx = this.getSmallestValueIdx(openNodes);
      const openNode = openNodes[smallestValueIdx];
      openNodes.splice(smallestValueIdx, 1);

      if (openNode.cell.equals(endCell)){
        return this.listFromFinalNode(openNode);
      }

      // get the vector position of the open node
      const openCell = openNode?.cell;

      // iterate through the 8 adjacent nodes
      for (let successorIdx = 0; successorIdx < this.adjacentRelations.length; successorIdx++) {
        const successorCell = openCell?.add(this.adjacentRelations[successorIdx]);

        // skip if off the grid
        if (
          successorCell.x < 0 ||
          successorCell.y < 0 ||
          successorCell.x >= this.height ||
          successorCell.y >= this.width
        ) {
          continue;
        }

        // skip if unavailable
        if (!this.cellIsAvailable(successorCell)) {
          continue;
        }

        // skip if closed already
        const closedAtSuccessorPosition = closedGrid[successorCell.x][successorCell.y]
        if (closedAtSuccessorPosition) {
          continue;
        }
        
        // calculate the distance(ish) from the start to the open node
        const distToOpenNode = [0, 2, 5, 7].includes(successorIdx) ? 14 : 10;
        const distToStart = distToOpenNode + openNode?.distToStart;
        
        // calculate the distance to the end node
        const distToEnd = MathUtils.calcDistBetweenPoints(successorCell, endCell);

        // create a node representing the opened node
        const successorNode = new AStarNode(successorCell, distToStart, distToEnd, openNode);
        
        // add this to the list of open nodes
        // efficiency could probs be improved with a binary search if we keep openNodes sorted, but we'll see if thats worth it
        const nodeIdxAtSamePos = this.getNodeIdxAtPos(openNodes, successorCell);
        if (nodeIdxAtSamePos === -1) {
          openNodes.push(successorNode);
        }
        else if (successorNode.value < openNodes[nodeIdxAtSamePos].value){
          openNodes[nodeIdxAtSamePos] = successorNode;
        }
      }
      // close the node we have just looked at the 8 adjacent nodes of
      closedGrid[openCell.x][openCell.y] = openNode;
    }

    return null;
  }

  private getSmallestValueIdx(nodes: AStarNode[]) {
    let smallestValue = nodes[0].value;
    let smallestValueIdx = 0;

    // linear search
    for (let nodeIdx = 1; nodeIdx < nodes.length; nodeIdx++) {
      if (nodes[nodeIdx].value < smallestValue) {
        smallestValue = nodes[nodeIdx].value;
        smallestValueIdx = nodeIdx;
      }
    }

    return smallestValueIdx;
  }

  private getNodeIdxAtPos(nodes: AStarNode[], position: Vector2) {
    for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx++) {
      if (nodes[nodeIdx].cell.equals(position)) {
        return nodeIdx
      }
    }

    return -1;
  }

  private listFromFinalNode(node: AStarNode): Vector2[] {
    let currentNode = node;
    const cellList: Vector2[] = [node.cell];

    while (currentNode.lastNode) {
      currentNode = currentNode.lastNode;
      cellList.unshift(currentNode.cell);
    }

    return cellList;
  }

  private cellIsAvailable(pos: Vector2) {
    return !(
      this.availabilityGrid[pos.y][pos.x].type === 'element'
    )
  }

  // public static pathToRelativeInstructions(path: Vector2[]): Vector2[] {
  //   const relativeInstructions = [];

  //   for (let cellIdx = 1; cellIdx < path.length; cellIdx++) {
  //     const relativeInstruction = path[cellIdx]
  //       .subtract(path[cellIdx - 1])
  //       .getNormalized();
  //     relativeInstructions.push(relativeInstruction);
  //   }

  //   return relativeInstructions;
  // }
}