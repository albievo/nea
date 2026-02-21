import $ from 'jquery';
import closeIcon from '../../assets/icons/cross.svg';

export type ModalDescriptor = { title: string, body: ModalBodyDescriptor  }

export type ModalBodyDescriptor = 
  | { type: 'plain-text', text: string  }
  | { type: 'log-in', onSubmit: LoginFunction }
  | { type: 'text-img', text: string, img: string }

type LoginFunction = (email: string, password: string) => Promise<void>;

export class Modal {

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
}