import './index.scss';

import { EditorApp } from "./editor/app/EditorApp";
import { Vector2 } from "./utils/Vector2";
import { ChipLibrary } from './editor/model/chip/ChipLibrary';
import { EditorUI } from './ui/EditorUI';

const worldSize = new Vector2(50, 50);

const chipLibrary = new ChipLibrary()
chipLibrary.register([
  {
    id: 'and-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'and'
    },
    name: 'and',
    icon: './assets/images/chips/and-gate.png'
  },
  {
    id: 'nand-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'nand'
    },
    name: 'nand',
    icon: './assets/images/chips/nand-gate.png'
  },
  {
    id: 'not-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'not'
    },
    name: 'not',
    icon: './assets/images/chips/not-gate.png'
  }
]);

const app = new EditorApp(worldSize, chipLibrary);
app.start();

const ui = new EditorUI(app, chipLibrary);
ui.addChipPreview('and-primitive');

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
});

app.execute({
  type: 'add-chip-element',
  pos: new Vector2(20, 25),
  elemId: 'test-and-chip-1',
  defId: 'and-primitive'
})

app.execute({
  type: 'add-chip-element',
  pos: new Vector2(20, 30),
  elemId: 'test-not-chip-2',
  defId: 'not-primitive'
})