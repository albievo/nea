import $ from 'jquery';
import { ElementRenderable } from '../../editor/rendering/renderables/grid-elements/ElementRenderable';
import { GridElementRenderable } from '../../editor/rendering/renderables/grid-elements/GridElementRenderable';
import { Vector2 } from '../../utils/Vector2';
import { NodeType } from '../../editor/model/netlist/Netlist';
import { Renderer } from '../../editor/rendering/Renderer';
import { Camera } from '../../editor/rendering/Camera';
import draggable from '../../assets/icons/draggable.svg';
import 'select2/dist/css/select2.css';
import 'select2';
import { cropImageToAspect } from '../../utils/AssetUtils';
import { NetlistBehaviour } from '../../editor/model/chip/ChipBehaviour';

(window as any).$ = $;
(window as any).jQuery = $;

export type ModalDescriptor = { title: string, body: ModalBodyDescriptor  }

export type ModalBodyDescriptor = 
  | { type: 'plain-text', text: string  }
  | { type: 'log-in', onSubmit: LoginFunction }
  | { type: 'text-img', text: string, img: string }
  | { type: 'saved-chip', chipName: string, img: string }
  | { type: 'netlist-chip-creation',
      inputIdToName: Map<string, string>,
      outputIdToName: Map<string, string>,
      onSave: SaveNetlistFunction
    }

type LoginFunction = (email: string, password: string) => Promise<void>;
type SaveNetlistFunction = (name: string, inputOrder: string[], outputOrder: string[]) => void;

export class Modal {

  private readonly PREVIEW_CANVAS_WIDTH = 200; // measured in px

  constructor(
    private dets: ModalDescriptor
  ) { }

  public open() {
    this.renderEmptyModal(this.dets.title);
    this.renderModalBody(this.dets.body);
  }

  public close() {
    $('.modal-overlay').remove();
    $(document).off('keydown.modalEscapeKeyTracker');
  }

  private renderModalBody(body: ModalBodyDescriptor) {
    switch (body.type) {
      case 'plain-text':
        this.renderPlainTextModal(body.text);
        break;

      case 'log-in':
        this.renderLoginModal(body.onSubmit);
        break;
      
      case 'text-img':
        this.renderTextImgModal(body.text, body.img)
        break;
      
      case 'saved-chip':
        this.renderSavedChipModal(body.chipName, body.img);
        break;
      
      case 'netlist-chip-creation':
        this.renderNetlistChipCreationModal(
          body.inputIdToName,
          body.outputIdToName,
          body.onSave
        )
        break;

      default: {
        const _exhaustive: never = body;
        return _exhaustive;
      }
    }
  }

  private renderEmptyModal(title: string) {
    const $overlay = $('<div>')
      .addClass('modal-overlay');

    const $modal = $(`
      <div class="modal">
        <div class="modal-title">
          <h2></h2>
          <button class="close-btn modal-close click-to-close-modal" aria-label="Close modal">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              width="800px"
              height="800px"
              viewBox="0 0 32 32"
            >
                <path d="M18.8,16l5.5-5.5c0.8-0.8,0.8-2,0-2.8l0,0C24,7.3,23.5,7,23,7c-0.5,0-1,0.2-1.4,0.6L16,13.2l-5.5-5.5  c-0.8-0.8-2.1-0.8-2.8,0C7.3,8,7,8.5,7,9.1s0.2,1,0.6,1.4l5.5,5.5l-5.5,5.5C7.3,21.9,7,22.4,7,23c0,0.5,0.2,1,0.6,1.4  C8,24.8,8.5,25,9,25c0.5,0,1-0.2,1.4-0.6l5.5-5.5l5.5,5.5c0.8,0.8,2.1,0.8,2.8,0c0.8-0.8,0.8-2.1,0-2.8L18.8,16z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body"></div>
      </div>
    `);

    $modal.find('h2').text(title);

    $overlay.append($modal);
    $('#ui').append($overlay);
  }

  private renderPlainTextModal(text: string) {
    const $body = $('.modal-body');
    $body.text(text);
  }

  private renderLoginModal(onSubmit: LoginFunction) {
    throw new Error('not yet implemented');
  }

  private renderTextImgModal(text: string, img: string) {
    const $body = $('.modal-body');
    $body.append($(`
      <p class='text'></p>

      <div class='img-container'>
        <img src='${img}' alt=''>
      </div>

      <div class='continue-btn-container'>
        <button class='continue-btn primary-btn click-to-close-modal'>
          Continue
        </button>
      </div>
    `));

    $body.find('.text').html(text);
  }

  private renderSavedChipModal(name: string, img: string) {
    const msg = `<b>${name}</b> chip saved succesfully`;

    this.renderTextImgModal(msg, img);
  }

  private renderNetlistChipCreationModal(
    inputIdToName: Map<string, string>,
    outputIdToName: Map<string, string>,
    onSave: SaveNetlistFunction
  ) {
    const inputs = inputIdToName.size;
    const outputs = outputIdToName.size;

    const canvasDimsCells = ElementRenderable.calcDims(inputs, outputs, 3);
    const cellInPx = this.PREVIEW_CANVAS_WIDTH / canvasDimsCells.x
    const canvasHeightPx = canvasDimsCells.y * cellInPx;

    const $body = $('.modal-body');
    $body.append($(`
      <form id='save-netlist-form'>

        <div class='form-row'>
          <label for='chip-name'>Chip Name <span class='red-ask'>*</span></label>
          <input
            id='chip-name'
            class="form-input text-input"
            name="chip-name"
            type='text'
            maxLength='31'
            required
          />
        </div>

        <div class="form-row">
          <label for="chip-image">Chip Icon</label>
          <label for="chip-image" class="upload-btn grey-btn">
            +
          </label>

          <input
            id="chip-image"
            class="form-input img-input"
            name="chip-image"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            hidden
          />
        </div>
        
        <div class='form-row'>
          <p>Chip Preview</p>
          <div class='chip-creation-preview'>
            <div id="input-order-selects" class="order-selects"></div>
            <input type="hidden" name="input-item-order" id="input-item-order" />

            <div
              class='preview-container'
              style="width: ${this.PREVIEW_CANVAS_WIDTH}px; height: ${canvasHeightPx}px;"
            >
              <canvas class='preview-canvas'></canvas>
            </div>

            <div id="output-order-selects" class="order-selects"></div>
            <input type="hidden" name="output-item-order" id="output-item-order" />
          </div>
        </div>

        <div class='submit-row'>
          <button class="cancel-btn click-to-close-modal secondary-btn" type="button">Cancel</button>
          <button class="submit-btn primary-btn" type="submit">Save Chip</button>
        </div>

      </form>
    `));

    // -- render preview grid element to canvas --
    const canvas = $body.find('.preview-canvas');

    const gridElementRenderable = new GridElementRenderable({
      id: 'preview-element',
      startingPos: new Vector2(0, 0),
      inputs, outputs,
      width: canvasDimsCells.x,
      color: 'stdElementBackground',
      type: NodeType.CHIP,
      renderState: {
        wires: new Map(),
        inputPins: new Map(),
        outputPins: new Map()
      },
      name: 'Chip Name'
    });

    const camera = new Camera(canvas, canvasDimsCells, 1, 1);
    const renderer = new Renderer(camera, canvas);
    
    gridElementRenderable.render(renderer, camera);

    // --- build Select2 dropdowns (one per slot) ---

    const inputItems = Array.from(inputIdToName.entries()).map(([id, text]) => ({ id, text }));
    const outputItems = Array.from(outputIdToName.entries()).map(([id, text]) => ({ id, text }));

    // build inputs
    const inputHidden = document.getElementById('input-item-order') as HTMLInputElement;
    buildUniqueSelectGroup({
      $container: $('#input-order-selects'),
      items: inputItems,
      slotCount: inputItems.length,
      selectClass: 'input-order-select',
      hidden: inputHidden,
      placeholder: 'Input'
    });

    // build outputs
    const outputHidden = document.getElementById('output-item-order') as HTMLInputElement;
    buildUniqueSelectGroup({
      $container: $('#output-order-selects'),
      items: outputItems,
      slotCount: outputItems.length,
      selectClass: 'output-order-select',
      hidden: outputHidden,
      placeholder: 'Output'
    });

    // -- make list items align with inputs and outputs --
    for (let pinIdx = 0; pinIdx < inputIdToName.size; pinIdx++) {
      const cellPos = gridElementRenderable.getInputPos(pinIdx);
      const screenPos = camera.worldPosToScreen(cellPos.add(0, 0.5));

      $(`#input-order-select-${pinIdx}`).parent()
        .css({ 'top': `${screenPos.y}px` });
    }

    for (let pinIdx = 0; pinIdx < outputIdToName.size; pinIdx++) {
      const cellPos = gridElementRenderable.getOutputPos(pinIdx);
      const screenPos = camera.worldPosToScreen(cellPos.add(0, 0.5));

      $(`#output-order-select-${pinIdx}`).parent()
        .css({ 'top': `${screenPos.y}px` });
    }

    // -- add dynamic update listeners --
    // add listener for changed name
    const $chipNameInput = $('#chip-name');
    $chipNameInput.on('input', () => {
      const name = $chipNameInput.val() as string;
      console.log(name);
      gridElementRenderable.updateName(name);
      gridElementRenderable.render(renderer, camera);
    })

    // add listener for changed icon
    const $chipImgInput = $('#chip-image')
    $chipImgInput.on('change', () => {
      const input = $chipImgInput.get(0) as HTMLInputElement;
      if (!input.files || input.files.length === 0) {
        console.log('input cancelled');
        return; // user cancelled
      }

      const file = input.files[0];
      cropImageToAspect(file, canvasDimsCells.x / canvasDimsCells.y);
      const filePath = URL.createObjectURL(file);

      gridElementRenderable.updateIcon(filePath).then(() =>
        gridElementRenderable.render(renderer, camera)
      );
    });

    // add submit listener
    const $form = $('#save-netlist-form');
    $form.on('submit', e => {
      e.preventDefault();

      onSave(
        $chipImgInput.val() as string,
        $('#input-item-order').val() as string[],
        $('#output-item-order').val() as string[],
      )
    });
  }
}


function buildUniqueSelectGroup(params: {
  $container: JQuery<HTMLElement>;
  items: { id: string; text: string }[];
  slotCount: number;
  selectClass: string;
  hidden: HTMLInputElement;
  placeholder: string;
  // Optional, but recommended for Select2 inside modals
  $dropdownParent?: JQuery<HTMLElement>;
}) {
  const {
    $container,
    items,
    slotCount,
    selectClass,
    hidden,
    placeholder,
    $dropdownParent
  } = params;

  // selected id per slot (null until chosen)
  const selectedBySlot: (string | null)[] = Array.from({ length: slotCount }, () => null);

  $container.empty();

  for (let slotIdx = 0; slotIdx < slotCount; slotIdx++) {
    const selectId = `${selectClass}-${slotIdx}`;

    const $row = $(`
      <div class="order-row">
        <select
          id="${selectId}"
          class="${selectClass}"
          style="width: 100%"
          required
        ></select>
      </div>
    `);

    const $select = $row.find('select');

    // Placeholder option MUST have value=""
    $select.append(`<option value=""></option>`);

    // Options
    for (const item of items) {
      $select.append($(`<option value="${item.id}"></option>`).text(item.text));
    }

    $container.append($row);
  }

  // init Select2 after DOM is present
  const select2Opts: any = {
    placeholder,
    allowClear: false,
    width: 'resolve',
    minimumResultsForSearch: Infinity,
  };

  if ($dropdownParent && $dropdownParent.length) {
    select2Opts.dropdownParent = $dropdownParent;
  }

  const $selects = $container.find(`select.${selectClass}`);
  $selects.select2(select2Opts);

  function updateHidden() {
    hidden.value = JSON.stringify(selectedBySlot);
  }

  function refreshDisabledOptions() {
    const chosen = new Set(selectedBySlot.filter((v): v is string => Boolean(v)));

    $selects.each((idx, el) => {
      const current = selectedBySlot[idx];

      $(el).find('option').each((_, opt) => {
        const option = opt as HTMLOptionElement;
        const value = option.value;

        // skip placeholder
        if (!value) return;

        option.disabled = chosen.has(value) && value !== current;
      });
    });
  }

  function validateAllSelected(): boolean {
    return selectedBySlot.every((v) => typeof v === 'string' && v.length > 0);
  }

  function focusFirstEmpty() {
    const idx = selectedBySlot.findIndex(v => !v);
    if (idx === -1) return;

    const $first = $selects.eq(idx);
    $first.trigger('focus');
    // open dropdown to guide user
    $first.select2('open');
  }

  // wire changes
  $selects.on('change', function () {
    const id = (this as HTMLSelectElement).id;
    const slotIdxStr = id.split('-').pop();
    const slotIdx = slotIdxStr ? Number(slotIdxStr) : NaN;
    if (!Number.isFinite(slotIdx)) return;

    const v = (this as HTMLSelectElement).value || null;
    selectedBySlot[slotIdx] = v;

    refreshDisabledOptions();
    updateHidden();
  });

  // initial
  refreshDisabledOptions();
  updateHidden();

  return {
    selectedBySlot,
    refreshDisabledOptions,
    updateHidden,
    validateAllSelected,
    focusFirstEmpty,
  };
}