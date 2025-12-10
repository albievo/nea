import { RenderManager } from "./rendering/RenderManager";
import { WorkingChip } from "./application/WorkingChip";
import { Netlist } from "./netlist/Netlist";
import { Grid } from "./rendering/Grid";
import { InitialGridRenderPayload } from "./rendering/RenderPayloads";

import './index.scss';
import { Vector2 } from "./utils/Vector2";
import { GridElement } from "./rendering/GridElement";

const worldSize = new Vector2(10, 10);

const netlist = new Netlist([], [])
const workingChip = new WorkingChip(netlist)
const renderManager = new RenderManager(workingChip, worldSize);

const gridId = crypto.randomUUID();

renderManager.addRenderable(new Grid(gridId, renderManager));

renderManager.requestRender(gridId, {kind: "grid", initial: {
  size: worldSize,
  startingZoom: 10,
  maxZoom: 15,
  zoomCoefficient: 0.01
}});

const gridElementId = crypto.randomUUID();

renderManager.addRenderable(
  new GridElement(gridElementId, renderManager, new Vector2(5, 5), new Vector2(1, 1))
);

renderManager.requestRender(gridElementId, {kind: 'grid-element', initial: { color: 'red' }});