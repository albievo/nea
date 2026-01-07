import { EventHandlerMap } from "../../event/eventTypes";
import { Vector2 } from "../../../utils/Vector2";
import { BoundingBox, Renderable } from "../Renderable";
import { RenderManager } from "../RenderManager";
import { AStarPathfinder } from "../pathfinding/AStarPathfinder";
import { MathUtils } from "../../../utils/MathUtils";
import { Wire } from "./Wire";
import { GridElement } from "../../rendering/GridElement";
import events from "../../event/events";
import $ from 'jquery';

export class TempWire extends Wire<'temp-wire'> {
  protected _kind = 'temp-wire' as const; // as const specify typing as 'temp-wire' rather than just a string

  constructor(
    id: string, renderManager: RenderManager,
    fromId: string, fromElem: GridElement, fromIdx: number,
  ) {
    super(
      id, renderManager,
      fromId, fromElem, fromIdx,
    );

    $(document).on('mouseup.tempWireMouseUp', () => this.handleMouseUp());
  }

  protected getEventHandlers(): EventHandlerMap {
    return {
      ...this.baseEventHandlers,
      'mouse-changed-cell': this.handleMouseChangedCell.bind(this)
    }
  }

  protected renderObject(): void {
    this.drawPathToEndPoint(this.OUTER_WIDTH, 'black');
    this.drawPathToEndPoint(this.INNER_WIDTH, 'lightblue');
  }

  private handleMouseChangedCell(movement: {from: Vector2, to: Vector2}) {
    const takenBy = this.renderManager.availabilityGrid[movement.to.y][movement.to.x];

    if (takenBy.type === 'element') {
      return;
    }

    const newPath = this.pathfinder.pathfind(this.startingPos, movement.to);
    if (!newPath) {
      console.error(`couldn't pathfind from ${this.startingPos} to ${movement.to}`);
      return;
    }

    this.setPath(newPath);

    const endCell = newPath[newPath.length - 1]
    events.emit('temp-wire-path-updated', { endCell });
  }

  private handleMouseUp() {
    this.delete();
    events.emit('temp-wire-released', {
      fromElement: this.fromId,
      fromOutput: this.fromIdx
    });
  }

  private delete() {
    this.renderManager.rmvRenderable(this.id);
    this.rmvDefaultListeners();
    events.emit('render-required');
    $(document).off('mouseup.tempWireMouseUp');
  }
}