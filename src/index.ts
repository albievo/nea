import { RenderManager } from "./rendering/RenderManager";
import { WorkingChip } from "./application/WorkingChip";
import { Netlist } from "./netlist/Netlist";
import { Grid } from "./rendering/Grid";
import { InitialGridRenderPayload } from "./rendering/RenderPayloads";

const netlist = new Netlist([], [])
const workingChip = new WorkingChip(netlist)
const renderManager = new RenderManager(workingChip);

const gridId = crypto.randomUUID();

renderManager.addRenderable(new Grid(gridId, renderManager));

const payload: InitialGridRenderPayload = {
  kind: "initial-grid-render",
  height: 50,
  width: 50,
  startingZoom: 10,
  maxZoom: 15,
  zoomCoefficient: 10
}

renderManager.requestRender(gridId, payload);