import { EditorApp } from "../../editor/app/EditorApp";
import { Vector2 } from "../../utils/Vector2";
import { ChipPreview } from "./ChipPreview";
import $ from 'jquery';

export class Sidebar {
  private displayedChips = new Map<string, ChipPreview>();
  private $sidebar = $('#chip-selection-box');

  constructor(
    private app: EditorApp
  ) {
    // prevent space from opening/closing the sidebar
    // so it can be used for panning
    $('#chip-selection-box-title').on('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }

  addChip(preview: ChipPreview) {
    const duplicate = this.displayedChips.has(preview.definitionId)
    if (duplicate) throw new Error(`Duplicate chip id: ${preview.definitionId}`);

    this.displayedChips.set(preview.definitionId, preview);

    const chipBtn = this.addHTMLPreview(preview.name, preview.icon);

    chipBtn.on('mousedown', e => {
      e.preventDefault();

      this.app.execute({
        type: 'add-ghost-chip-element',
        defId: preview.definitionId,  
        mousePos: new Vector2(e.clientX, e.clientY)
      });
    })
  }

  private addHTMLPreview(name: string, icon: string): JQuery<HTMLButtonElement> {
    const chipPreview = $("<button>", { class: "chip-preview" }) as JQuery<HTMLButtonElement>;
    const imgContainer = $("<div>", { class: "img-container" });

    const img = $("<img>", {
      src: icon,
      alt: name
    });

    const title = $("<h3>").text(name.toUpperCase());

    // assemble
    imgContainer.append(img);
    chipPreview.append(imgContainer);
    chipPreview.append(title);

    $('#chip-selection-box-content').append(chipPreview);

    return chipPreview;
  }
}