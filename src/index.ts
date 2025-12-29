import { RenderManager } from "./rendering/RenderManager";
import { WorkingChip } from "./application/WorkingChip";
import { Netlist } from "./netlist/Netlist";
import { Grid } from "./rendering/Grid";
import { InitialGridRenderPayload, InitialGridElementMap } from "./rendering/RenderPayloads";

import './index.scss';
import { Vector2 } from "./utils/Vector2";
import { GridElement } from "./rendering/GridElement";

const worldSize = new Vector2(50, 50);

const netlist = new Netlist([], [])
const workingChip = new WorkingChip(netlist)
const renderManager = new RenderManager(workingChip, worldSize);

const gridId = crypto.randomUUID();

renderManager.addRenderable(new Grid(gridId, renderManager));

renderManager.requestRender({initialGrid: {
  gridId: gridId,
  size: worldSize,
}});

const gridElement1Id = crypto.randomUUID();

renderManager.addRenderable(
  new GridElement({
    id: gridElement1Id,
    renderManager,
    startingPos: new Vector2(23, 23),
    inputs: 1,
    outputs: 3 ,
    width: 3 
  })
);

const gridElement1InitalPayload: InitialGridElementMap = {
  [gridElement1Id]: {
    color: 'red'
  } 
}

renderManager.requestRender({initialGridElements: gridElement1InitalPayload});

const gridElement2Id = crypto.randomUUID();

renderManager.addRenderable(
  new GridElement({
    id: gridElement2Id,
    renderManager,
    startingPos: new Vector2(20, 20),
    inputs: 1,
    outputs: 1,
    width: 2
  })
);

const gridElement2InitalPayload: InitialGridElementMap = {
  [gridElement2Id]: {
    color: 'blue'
  } 
}

renderManager.requestRender({initialGridElements: gridElement2InitalPayload});

const gridElement3Id = crypto.randomUUID();

renderManager.addRenderable(
  new GridElement({
    id: gridElement3Id,
    renderManager,
    startingPos: new Vector2(28, 20),
    inputs: 2,
    outputs: 1,
    width: 2
  })
);

const gridElement3InitalPayload: InitialGridElementMap = {
  [gridElement3Id]: {
    color: 'green'
  } 
}

renderManager.requestRender({initialGridElements: gridElement3InitalPayload});