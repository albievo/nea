import { EditorApp } from "../editor/app/EditorApp";
import { ChipLibrary } from "../editor/model/chip/ChipLibrary";
import { ModalDescriptor, renderEmptyModal, renderLoginModal, renderPlainTextModal } from "./modal.ts/Modal";
import { SaveChipBtn } from "./save-chip-btn.ts/SaveChipBtn";
import { Sidebar } from "./sidebar/Sidebar";

export class EditorUI {
  private sidebar: Sidebar;
  private saveChipBtn: SaveChipBtn;

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

  addModal(modal: ModalDescriptor) {
    renderEmptyModal(modal.title);

    switch (modal.type) {
      case 'plain-text':
        renderPlainTextModal(modal.props.text);
        break;

      case 'log-in':
        renderLoginModal(modal.props.onSubmit);
        break;

      default: {
        const _exhaustive: never = modal;
        return _exhaustive;
      }
    }
  }
}