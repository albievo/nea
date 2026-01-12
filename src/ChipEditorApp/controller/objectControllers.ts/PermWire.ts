import { InputPin, OutputPin } from "../../model/netlist/Pins";
import { WorkingChip } from "../../model/WorkingChip";
import { PermWireRenderable } from "../../rendering/renderables/wires/PermWireRenderable";
import { RenderManager } from "../../rendering/RenderManager";
import { Wire } from "./Wire";

export class PermWire {
  public static create(
    model: WorkingChip, renderManager: RenderManager, 
    id: string, from: OutputPin, to: InputPin
  ) {
    // add connection to model
    model.addConnection(
      id, from, to
    );

    const fromElement = renderManager.getGridElementWithId(
      from.nodeId
    );
    const toElement = renderManager.getGridElementWithId(
      to.nodeId
    );
    if (!fromElement || !toElement) return;

    const renderable = new PermWireRenderable(id)
    renderManager.addRenderable(renderable);

    const startPos = fromElement.getOutputPos(from.outputIdx).add(1, 0);
    const endPos = toElement.getInputPos(to.inputIdx).subtract(1, 0);

    console.log(`pathfinding from ${startPos.toString()} to ${endPos.toString()}`)

    const initialPath = Wire.computePath(
      startPos, endPos,
      model.availabilityGrid, renderManager.previewAvailabilityOverlay
    );
    renderable.setPath(initialPath);
  }

  public static delete(
    model: WorkingChip, renderManager: RenderManager, 
    id: string
  ) {
    model.rmvConnection(id);
    renderManager.rmvRenderable(id);
  }

  public static updatePath(
    model: WorkingChip, renderManager: RenderManager,
    id: string
  ) {
    const connectionModel = model.getConnection(id);
    if (!connectionModel) return;

    const from = connectionModel.getFrom();
    const to = connectionModel.getTo();

    const fromElem = renderManager.getGridElementWithId(from.nodeId);
    const toElem = renderManager.getGridElementWithId(to.nodeId);
    if (!fromElem || !toElem) return;

    const fromPos = fromElem.getOutputPos(from.outputIdx).add(1, 0);
    const toPos = toElem.getInputPos(to.inputIdx).subtract(1, 0);

    console.log(`pathfinding from ${fromPos.toString()} to ${toPos.toString()}`)

    const path = Wire.computePath(
      fromPos, toPos,
      model.availabilityGrid, renderManager.previewAvailabilityOverlay
    );

    const renderable = renderManager.getPermWireWithId(id);
    if (!renderable) return;

    renderable.setPath(path);
  }
}