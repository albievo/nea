import { EditorApp } from "../../editor/app/EditorApp";
import $ from 'jquery';
import { EditorUI } from "../EditorUI";

export class SaveChipBtn {
  
  constructor(
    private app: EditorApp,
    private ui: EditorUI
  ) {
    $('#save-chip-btn').on('click', () => this.handleClick());
  }

  private handleClick() {
    const error = this.app.execute({
      type: 'save-current-chip',
      ui: this.ui
    })

    if (error.errorText) {
      this.ui.renderError(error.errorText);
    }
  }
}