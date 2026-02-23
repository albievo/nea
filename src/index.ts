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
    icon: './assets/images/chips/and-gate.png',
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
    icon: './assets/images/chips/nand-gate.png',
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
    icon: './assets/images/chips/not-gate.png',
    inputs: 1,
    outputs: 1
  }
]);

const app = new EditorApp(worldSize, chipLibrary, $('#canvas'));
app.start();

const ui = new EditorUI(app, chipLibrary);
ui.addChipPreview('and-primitive');
ui.addChipPreview('not-primitive');

ui.addModal({
  title: 'Save Chip',
  body: {
    type: 'netlist-chip-creation',
    inputIdToName: new Map<string, string>([
      ['id-a-1', 'a'],
      ['id-a-2', 'a']
    ]),
    outputIdToName: new Map<string, string>([
      ['id-c', 'c']
    ]),
    onSave: () => null
  }
});