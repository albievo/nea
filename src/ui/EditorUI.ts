import { EditorApp } from "../editor/app/EditorApp";
import { ChipLibrary } from "../editor/model/chip/ChipLibrary";
import { Modal, ModalDescriptor } from "./modal.ts/Modal";
import { SaveChipBtn } from "./save-chip-btn.ts/SaveChipBtn";
import { Sidebar } from "./sidebar/Sidebar";

export class EditorUI {
  private sidebar: Sidebar;
  private saveChipBtn: SaveChipBtn;
  private modal?: Modal;

  constructor(
    private app: EditorApp,
    private chipLibrary: ChipLibrary
  ) {
    this.sidebar = new Sidebar(this.app);
    this.saveChipBtn = new SaveChipBtn(this.app);
  }

  addChipPreview(chipDefId: string) {
    const definition = this.chipLibrary.get(chipDefId);
    this.sidebar.addChip({
      definitionId: chipDefId,
      icon: definition.icon,
      name: definition.name
    });
  }

  addModal(dets: ModalDescriptor) {
    if (this.modal) {
      console.error('Can only render 1 modal at a time');
      return;
    }

    this.modal = new Modal(dets);
    this.modal.open();
  }
}