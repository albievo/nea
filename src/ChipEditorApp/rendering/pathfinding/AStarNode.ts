import { Vector2 } from "../../../utils/Vector2";

export class AStarNode {
  private _cell: Vector2;

  private _value: number;
  private _distToStart: number;
  private _heuristicToEnd: number;

  private _lastNode?: AStarNode;

  constructor(cell: Vector2, distToStart: number, heuristicToEnd: number, lastNode?: AStarNode) {
    this._cell = cell;
    this._lastNode = lastNode;

    this._distToStart = distToStart;
    this._heuristicToEnd = heuristicToEnd;
    this._value = this.distToStart + this.heuristicToEnd;
  }

  public get cell(): Vector2 {
    return this._cell;
  }
  public get value(): number{
    return this._value;
  }
  public get distToStart(): number {
    return this._distToStart;
  }
  public get heuristicToEnd(): number {
    return this._heuristicToEnd;
  }
  public get lastNode(): AStarNode | undefined {
    return this._lastNode;
  }
}