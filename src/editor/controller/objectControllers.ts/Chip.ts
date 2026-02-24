import { Vector2 } from "../../../utils/Vector2";
import { WorkingChip } from "../../model/WorkingChip";
import events from "../../event/events";
import { NodeType } from "../../model/netlist/Netlist";
import { RenderManager } from "../../rendering/RenderManager";
import { GridElementRenderable } from "../../rendering/renderables/grid-elements/GridElementRenderable";
import { PermWire } from "./PermWire";
import { InteractionState } from "../InteractionState";
import { Value } from "../../model/netlist/Value";
import { ChipBehaviour } from "../../model/chip/ChipBehaviour";
import { ChipLibrary } from "../../model/chip/ChipLibrary";

export class Chip {
  public static createInputChip(
    model: WorkingChip, renderManager: RenderManager, interactionState: InteractionState,
    id: string, pos: Vector2
  ) {
    model.addChip(id, pos, new Vector2(3, 3), { type: NodeType.INPUT });

    // add renderable to render manager
    renderManager.addRenderable(
      new GridElementRenderable({
        id: id,
        startingPos: pos,
        inputs: 0,
        outputs: 1,
        width: 3,
        color: 'stdElementBackground',
        type: NodeType.INPUT,
        renderState: renderManager.renderState,
        name: `Input`,
        label: 'Input'
      })
    );
    
    interactionState.inputElements.set(id, Value.ZERO);
  }

  public static createOutputChip(
    model: WorkingChip, renderManager: RenderManager,
    id: string, pos: Vector2
  ) {
    model.addChip(id, pos, new Vector2(3, 3), { type: NodeType.OUTPUT });

    // add renderable to render manager
    renderManager.addRenderable(
      new GridElementRenderable({
        id: id,
        startingPos: pos,
        inputs: 1,
        outputs: 0,
        width: 3,
        color: 'stdElementBackground',
        type: NodeType.OUTPUT,
        renderState: renderManager.renderState,
        name: `Output`,
        label: 'Output'
      })
    );
  }
  public static deleteChip(
    model: WorkingChip, renderManager: RenderManager,
    id: string
  ) {
    // remove chip from model
    model.rmvChip(id);
    // remove chip from render manager
    renderManager.rmvRenderable(id);
  }

  public static gridElementFollowsMouse(
    model: WorkingChip, renderManager: RenderManager,
    id: string, offset: Vector2
  ) {
    const element = renderManager.getGridElementWithId(id);
    if (!element) return;

    // attach the listener for the changed cell
    events.on('mouse-changed-cell', ({ to }) => {      
      const pos = to.subtract(offset);
    
      const isValidPosition = this.checkValidPosition(
        model, pos, element.dims, id
      );

      // ---- update to the new position ----
      if (isValidPosition) {
        renderManager.moveGridElementPreview(id, pos);
      }

      // ---- update all perm wire routes ----
      for (const permWireId of renderManager.permWires) {
        PermWire.updatePath(model, renderManager, permWireId);
      }

    }, this.generateDraggingId(id));
  }

  public static checkValidPosition(
    model: WorkingChip,
    pos: Vector2, dims: Vector2, id?: string
  ) {
    // ---- calculate whether the new position is valid ----
    // bounding box for where the element would be in its new position
    const boundingBox = {
      top: pos.y,
      left: pos.x,
      bottom: pos.y + dims.y,
      right: pos.x + dims.x
    }

    return model.isValidPosition(boundingBox, id);
  }

  /**
   * @returns where the grid element should end up
   */
  public static stopGridElementFollowsMouse(
    renderManager: RenderManager, id: string
  ): Vector2 {
    const element = renderManager.getGridElementWithId(id);
    if (!element) return Vector2.zeroes;

    events.off('mouse-changed-cell', this.generateDraggingId(id));

    return element.pos;
  }

  private static generateDraggingId(id: string) {
    return `${id}-renderable-following-mouse`;
  }

  public static createChip(
    model: WorkingChip, renderManager: RenderManager, chipLibrary: ChipLibrary,
    id: string, defId: string,
    pos: Vector2
  ) {
    const def = chipLibrary.get(defId);

    const element = new GridElementRenderable({
      id: id,
      startingPos: pos,
      inputs: def.inputs,
      outputs: def.outputs,
      width: 3, // currently hard-coded, could be made more dynamic
      color: 'stdElementBackground',
      iconPath: def.icon,
      type: NodeType.CHIP,
      renderState: renderManager.renderState,
      name: def.name
    });

    model.addChip(id, pos, element.dims, { type: NodeType.CHIP, defId });

    // add renderable to render manager
    renderManager.addRenderable(
      element
    );
  }
}