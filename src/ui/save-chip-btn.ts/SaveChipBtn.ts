import { EditorApp } from "../../editor/app/EditorApp";

export class SaveChipBtn {
  
  constructor(
    private app: EditorApp
  ) {
    $('#save-chip-btn').on('click', () => this.handleClick());
  }

  private handleClick() {
    
  }
}