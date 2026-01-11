// import { EditorApp } from './ChipEditorApp/EditorApp';
// import { Grid } from "./ChipEditorApp/rendering/renderables/Grid";
// import { Vector2 } from "./utils/Vector2";
// import { GridElement } from "./ChipEditorApp/rendering/renderables/GridElementRenderable";
// import events from "./ChipEditorApp/event/events"; 
import './index.scss';

import { EditorApp } from "./ChipEditorApp/app/EditorApp";
import { Vector2 } from "./utils/Vector2";

// const worldSize = new Vector2(50, 50);
// const chipEditorApp = new EditorApp(worldSize);
// const renderManager = chipEditorApp.renderer;

// const gridId = crypto.randomUUID();

// const grid = new Grid(gridId, renderManager, worldSize)

// renderManager.addRenderable(grid);

// const gridElement1Id = crypto.randomUUID();
// const gridElement1 = new GridElement({
//     id: gridElement1Id,
//     renderManager,
//     startingPos: new Vector2(23, 23),
//     inputs: 1,
//     outputs: 3 ,
//     width: 3,
//     color: 'red'
//   })

// renderManager.addRenderable(gridElement1);

// const gridElement2Id = crypto.randomUUID();
// const gridElement2 = new GridElement({
//     id: gridElement2Id,
//     renderManager,
//     startingPos: new Vector2(20, 20),
//     inputs: 1,
//     outputs: 1,
//     width: 2,
//     color: 'blue'
//   })

// renderManager.addRenderable(gridElement2);

// const gridElement3Id = crypto.randomUUID();
// const gridElement3 = new GridElement({
//     id: gridElement3Id,
//     renderManager,
//     startingPos: new Vector2(28, 20),
//     inputs: 2,
//     outputs: 1,
//     width: 2,
//     color: 'green'
//   })

// renderManager.addRenderable(gridElement3);

const worldSize = new Vector2(50, 50);

const app = new EditorApp(worldSize);
app.start();

app.execute({
  type: 'add-input-element',
  pos: new Vector2(25, 25),
  id: 'test-input-1'
});

app.execute({
  type: 'add-output-element',
  pos: new Vector2(30, 25),
  id: 'test-output-1'
})