import { ChipPreview } from "./ChipPreview";
import $ from 'jquery';

export class Sidebar {
  private displayedChips = new Map<string, ChipPreview>();
  private $sidebar = $('#chip-selection-box');

  constructor() {
    const summary = $('#chip-selection-box-title');

    summary.on('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }

  addChip(preview: ChipPreview) {
    const duplicate = this.displayedChips.has(preview.definitionId)
    if (duplicate) throw new Error(`Duplicate chip id: ${preview.definitionId}`);

    this.displayedChips.set(preview.definitionId, preview);

    this.addHTMLPreview(preview.name, preview.icon);
  }

  private addHTMLPreview(name: string, icon: string) {
    const chipPreview = $("<div>", { class: "chip-preview" });
    const imgContainer = $("<div>", { class: "img-container" });

    const img = $("<img>", {
      src: icon,
      alt: name
    });

    const title = $("<h4>").text(name.toUpperCase());

    // assemble
    imgContainer.append(img);
    chipPreview.append(imgContainer);
    chipPreview.append(title);

    $('#chip-selection-box-content').append(chipPreview);
  }
}