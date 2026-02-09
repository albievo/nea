import { EditorApp } from "../../editor/app/EditorApp";
import $ from 'jquery';

export class SaveChipBtn {
  
  constructor(
    private app: EditorApp
  ) {
    $('#save-chip-btn').on('click', () => this.handleClick());
  }

  private handleClick() {

  }
}