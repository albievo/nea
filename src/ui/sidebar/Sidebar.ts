import { EditorApp } from "../../editor/app/EditorApp";
import { NodeType } from "../../editor/model/netlist/Netlist";
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
    this.$sidebar.on('click', () => this.toggleSidebar());

    this.addInputOutputCreationListeners();
  }

  addChip(preview: ChipPreview) {
    const duplicate = this.displayedChips.has(preview.definitionId)
    if (duplicate) throw new Error(`Duplicate chip id: ${preview.definitionId}`);

    this.displayedChips.set(preview.definitionId, preview);

    const chipBtn = this.addHTMLPreview(preview.name, preview.icon);

    chipBtn.on('mousedown', e => {
      e.preventDefault();

      this.app.execute({
        type: 'add-ghost-element',
        details: {
          type: NodeType.CHIP,
          defId: preview.definitionId
        },
        mousePos: new Vector2(e.clientX, e.clientY)
      });
    })
  }

  private addInputOutputCreationListeners() {
    $('.input-chip-preview').on('mousedown', e => {
      e.preventDefault();

      this.app.execute({
        type: 'add-ghost-element',
        mousePos: new Vector2(e.clientX, e.clientY),
        details: { type: NodeType.INPUT }
      })
    })

    $('.output-chip-preview').on('mousedown', e => {
      e.preventDefault();

      this.app.execute({
        type: 'add-ghost-element',
        mousePos: new Vector2(e.clientX, e.clientY),
        details: { type: NodeType.OUTPUT }
      })
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

    $('#chip-selection-box-content-chips').append(chipPreview);

    return chipPreview;
  }

  private toggleSidebar() {
    const open = this.$sidebar.hasClass('open');

    if (open) {
      this.$sidebar.removeClass('open');
      this.$sidebar.addClass('closed');
    } else {
      this.$sidebar.removeClass('closed');
      this.$sidebar.addClass('open');
    }
  }
}