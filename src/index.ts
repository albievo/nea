import './index.scss';

import { EditorApp } from "./editor/app/EditorApp";
import { Vector2 } from "./utils/Vector2";
import { ChipLibrary } from './editor/model/chip/ChipLibrary';
import { EditorUI } from './ui/EditorUI';
import $ from 'jquery';

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
    icon: './assets/images/chips/transparent-and-gate.png',
    inputs: 2,
    outputs: 1
  },
  {
    id: 'nand-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'nand'
    },
    name: 'nand',
    icon: './assets/images/chips/transparent-nand-gate.png',
    inputs: 2,
    outputs: 1
  },
  {
    id: 'not-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'not'
    },
    name: 'not',
    icon: './assets/images/chips/transparent-not-gate.png',
    inputs: 1,
    outputs: 1
  },
  {
    id: 'or-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'or'
    },
    name: 'or',
    icon: './assets/images/chips/transparent-or-gate.png',
    inputs: 2,
    outputs: 1
  },
  {
    id: 'xor-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'xor'
    },
    name: 'xor',
    icon: './assets/images/chips/transparent-xor-gate.png',
    inputs: 2,
    outputs: 1
  },
  {
    id: 'nothing-primitive',
    behaviourSpec: {
      kind: 'primitive',
      type: 'test-2x2-nothing-doer'
    },
    name: 'nothing-doer',
    icon: '',
    inputs: 2,
    outputs: 2
  },
]);

const app = new EditorApp(worldSize, chipLibrary, $('#canvas'));
app.start();

const ui = new EditorUI(app, chipLibrary);
ui.addChipPreview('and-primitive');
ui.addChipPreview('not-primitive');
ui.addChipPreview('or-primitive');
ui.addChipPreview('nand-primitive');
ui.addChipPreview('xor-primitive');