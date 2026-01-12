// import { EditorApp } from './ChipEditorApp/EditorApp';
// import { Grid } from "./ChipEditorApp/rendering/renderables/Grid";
// import { Vector2 } from "./utils/Vector2";
// import { GridElement } from "./ChipEditorApp/rendering/renderables/GridElementRenderable";
// import events from "./ChipEditorApp/event/events"; 
import './index.scss';

import { EditorApp } from "./ChipEditorApp/app/EditorApp";
import { Vector2 } from "./utils/Vector2";

const worldSize = new Vector2(50, 50);

const app = new EditorApp(worldSize);
app.start();

app.execute({
  type: 'add-input-element',
  pos: new Vector2(25, 25),
  id: 'test-input-1'
});

app.execute({
  type: 'add-input-element',
  pos: new Vector2(25, 30),
  id: 'test-input-2'
})

app.execute({
  type: 'add-output-element',
  pos: new Vector2(30, 25),
  id: 'test-output-1'
});

app.execute({
  type: 'add-output-element',
  pos: new Vector2(30, 30),
  id: 'test-output-2'
})