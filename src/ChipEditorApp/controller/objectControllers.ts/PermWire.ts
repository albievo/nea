import { InputPin, OutputPin } from "../../model/netlist/Pins";
import { WorkingChip } from "../../model/WorkingChip";
import { PermWireRenderable } from "../../rendering/renderables/wires/PermWireRenderable";
import { RenderManager } from "../../rendering/RenderManager";

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

    renderManager.addRenderable(new PermWireRenderable(
      id,
      from.nodeId, fromElement, from.outputIdx,
      to.nodeId, toElement, to.inputIdx
    ));
  }

  public static delete(
    model: WorkingChip, renderManager: RenderManager, 
    id: string
  ) {
    model.rmvConnection(id);
    renderManager.rmvRenderable(id);
  }
}