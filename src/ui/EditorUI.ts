import { EditorApp } from "../editor/app/EditorApp";
import { ChipLibrary } from "../editor/model/chip/ChipLibrary";
import { Sidebar } from "./sidebar/Sidebar";

export class EditorUI {
  private sidebar: Sidebar;

  constructor(
    private app: EditorApp,
    private chipLibrary: ChipLibrary
  ) {
    this.sidebar = new Sidebar();
  }

  addChipPreview(chipDefId: string) {
    const definition = this.chipLibrary.get(chipDefId);
    this.sidebar.addChip({
      definitionId: chipDefId,
      icon: definition.icon,
      name: definition.name
    });
  }
}