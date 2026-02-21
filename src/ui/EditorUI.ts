import { EditorApp } from "../editor/app/EditorApp";
import { ChipLibrary } from "../editor/model/chip/ChipLibrary";
import { ErrorPopup } from "./error-popup/ErrorPopup";
import { Modal, ModalDescriptor } from "./modal.ts/Modal";
import { SaveChipBtn } from "./save-chip-btn.ts/SaveChipBtn";
import { Sidebar } from "./sidebar/Sidebar";
import $ from 'jquery';

export class EditorUI {
  private sidebar: Sidebar;
  private saveChipBtn: SaveChipBtn;
  private modal?: Modal;

  private readonly ERROR_TEXT_DURATION = 5000;

  constructor(
    private app: EditorApp,
    private chipLibrary: ChipLibrary
  ) {
    this.sidebar = new Sidebar(this.app);
    this.saveChipBtn = new SaveChipBtn(this.app, this);
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

    // add listeners for closing
    $('.click-to-close-modal').on('click', () => this.closeModal());
    $(document).on('keydown.modalEscapeKeyTracker', e => {
      if (e.key === 'Escape' || e.key === 'Esc') this.closeModal();
    });
  }

  private closeModal() {
    const modal = this.modal;

    if (!modal) {
      console.error('no modal to close');
      return;
    }

    modal.close();
    this.modal = undefined;
  }
  
  renderError(text: string) {
    const popup = new ErrorPopup(text);
    popup.open();
    setTimeout(() => popup.close(), this.ERROR_TEXT_DURATION)
  }
}