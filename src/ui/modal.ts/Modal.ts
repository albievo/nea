import $ from 'jquery';
import { ElementRenderable } from '../../editor/rendering/renderables/grid-elements/ElementRenderable';
import { GridElementRenderable } from '../../editor/rendering/renderables/grid-elements/GridElementRenderable';
import { Vector2 } from '../../utils/Vector2';
import { NodeType } from '../../editor/model/netlist/Netlist';
import { Renderer } from '../../editor/rendering/Renderer';
import { Camera } from '../../editor/rendering/Camera';
import draggable from '../../assets/icons/draggable.svg';

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
type SaveNetlistFunction = (inputOrder: string, outputOrder: string) => void;

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
            <ul id='input-order-sortable-list' class='sortable-list'></ul>
            <div
              class='preview-container'
              style="width: ${this.PREVIEW_CANVAS_WIDTH}px; height: ${canvasHeightPx}px;"
            >
              <canvas class='preview-canvas'></canvas>
            </div>
            <ul id='output-order-sortable-list' class='sortable-list'></ul>
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

    // -- add items to sortable lists --
    for (let [id, name] of inputIdToName) {
      $('#input-order-sortable-list').append($(`
        <li class='input-${id}' data-id='${id}'>
          <img src='${draggable}'>
          <p>${name}</p>
        </li>
      `));
    }
    for (let [id, name] of outputIdToName) {
      $('#output-order-sortable-list').append($(`
        <li class='output-${id}' data-id='${id}'>
          <p>${name}</p>
          <img src='${draggable}'>

        </li>
      `));
    }

    // -- make list items align with inputs and outputs --
    let pinIdx = 0;
    for (let id of inputIdToName.keys()) {
      const cellPos = gridElementRenderable.getInputPos(pinIdx);
      const screenPos = camera.worldPosToScreen(cellPos.add(0, 0.5));

      $(`.input-${id}`).css({ 'top': `${screenPos.y}px` });

      pinIdx += 1;
    }

    pinIdx = 0;
    for (let id of outputIdToName.keys()) {
      const cellPos = gridElementRenderable.getOutputPos(pinIdx);
      const screenPos = camera.worldPosToScreen(cellPos.add(0, 0.5));

      $(`.output-${id}`).css({ 'top': `${screenPos.y}px` });

      pinIdx += 1;
    }
  }
}