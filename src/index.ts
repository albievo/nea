import './index.scss';

import { EditorApp } from "./editor/app/EditorApp";
import { Vector2 } from "./utils/Vector2";
import { ChipLibrary } from './editor/model/chip/ChipLibrary';

const worldSize = new Vector2(50, 50);

const chipLibrary = new ChipLibrary()
chipLibrary.register([
  {
    id: 'and-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'and'
    }
  },
  {
    id: 'or-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'or'
    }
  },
  {
    id: 'nand-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'nand'
    }
  },
  {
    id: 'not-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'not'
    }
  }
]);

const app = new EditorApp(worldSize, chipLibrary);
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