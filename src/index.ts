import { RenderManager } from "./ChipEditorApp/rendering/RenderManager";
import { WorkingChip } from "./application/WorkingChip";
import { Netlist } from "./netlist/Netlist";
import { Grid } from "./ChipEditorApp/rendering/Grid";
import { Vector2 } from "./utils/Vector2";
import { GridElement } from "./ChipEditorApp/rendering/GridElement";
import events from "./event/events"; 
import './index.scss';

const worldSize = new Vector2(50, 50);

const netlist = new Netlist([], [])
const workingChip = new WorkingChip(netlist)
const renderManager = new RenderManager(workingChip, worldSize);

const gridId = crypto.randomUUID();

const grid = new Grid(gridId, renderManager, worldSize)

renderManager.addRenderable(grid);

const gridElement1Id = crypto.randomUUID();
const gridElement1 = new GridElement({
    id: gridElement1Id,
    renderManager,
    startingPos: new Vector2(23, 23),
    inputs: 1,
    outputs: 3 ,
    width: 3,
    color: 'red'
  })

renderManager.addRenderable(gridElement1);

const gridElement2Id = crypto.randomUUID();
const gridElement2 = new GridElement({
    id: gridElement2Id,
    renderManager,
    startingPos: new Vector2(20, 20),
    inputs: 1,
    outputs: 1,
    width: 2,
    color: 'blue'
  })

renderManager.addRenderable(gridElement2);

const gridElement3Id = crypto.randomUUID();
const gridElement3 = new GridElement({
    id: gridElement3Id,
    renderManager,
    startingPos: new Vector2(28, 20),
    inputs: 2,
    outputs: 1,
    width: 2,
    color: 'green'
  })

renderManager.addRenderable(gridElement3);

events.emit('render-required');