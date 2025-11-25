import { RenderManager } from "./rendering/RenderManager";
import { WorkingChip } from "./application/WorkingChip";
import { Netlist } from "./netlist/Netlist";
import { Grid } from "./rendering/Grid";
import { InitialGridRenderPayload } from "./rendering/RenderPayloads";

import './index.scss'

const netlist = new Netlist([], [])
const workingChip = new WorkingChip(netlist)
const renderManager = new RenderManager(workingChip);

const gridId = crypto.randomUUID();

renderManager.addRenderable(new Grid(gridId, renderManager));

const payload: InitialGridRenderPayload = {
  height: 10,
  width: 10,
  startingZoom: 10,
  maxZoom: 15,
  zoomCoefficient: 0.01
}

renderManager.requestRender(gridId, {initial: payload});