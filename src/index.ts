import { RenderManager } from "./rendering/RenderManager";
import { WorkingChip } from "./application/WorkingChip";
import { Netlist } from "./netlist/Netlist";
import { Grid } from "./rendering/Grid";
import { InitialGridRenderPayload, InitialGridElementMap } from "./rendering/RenderPayloads";

import './index.scss';
import { Vector2 } from "./utils/Vector2";
import { GridElement } from "./rendering/GridElement";

const worldSize = new Vector2(5, 5 );

const netlist = new Netlist([], [])
const workingChip = new WorkingChip(netlist)
const renderManager = new RenderManager(workingChip, worldSize);

const gridId = crypto.randomUUID();

renderManager.addRenderable(new Grid(gridId, renderManager));

renderManager.requestRender({initialGrid: {
  gridId: gridId,
  size: worldSize,
  startingZoom: 10,
  maxZoom: 15,
  zoomCoefficient: 0.01
}});

const gridElement1Id = crypto.randomUUID();

renderManager.addRenderable(
  new GridElement(gridElement1Id, renderManager, new Vector2(1, 1), new Vector2(1, 1))
);

const gridElement1InitalPayload: InitialGridElementMap = {
  [gridElement1Id]: {
    color: 'red'
  } 
}

renderManager.requestRender({initialGridElements: gridElement1InitalPayload});

// const gridElement2Id = crypto.randomUUID();

// renderManager.addRenderable(
//   new GridElement(gridElement2Id, renderManager, new Vector2(1, 1), new Vector2(2, 1 ))
// );

// const gridElement2InitalPayload: InitialGridElementMap = {
//   [gridElement2Id]: {
//     color: 'blue'
//   } 
// }

// renderManager.requestRender({initialGridElements: gridElement2InitalPayload});

