import $ from 'jquery';
import closeIcon from '../../assets/icons/cross.svg';

export type ModalDescriptor = 
  | { type: 'plain-text', title: string, props: { text: string } }
  | { type: 'log-in', title: string, props: { onSubmit: LoginFunction }}

type LoginFunction = (email: string, password: string) => Promise<void>;

export function renderEmptyModal(title: string) {
  const $overlay = $('<div>')
    .addClass('modal-overlay');

  const $modal = $(`
    <div class="modal">
      <div class="modal-title">
        <h2></h2>
        <button class="modal-close" aria-label="Close modal">
          <img src="/assets/icons/cross.svg" alt="">
        </button>
      </div>
      <div class="modal-body"></div>
    </div>
  `);

  $modal.find('h2').text(title);
  $modal.find('.modal-close img').attr('src', closeIcon);

  $overlay.append($modal);
  $('#ui').append($overlay);
}

export function renderPlainTextModal(text: string) {
  const $body = $('.modal-body');
  $body.text(text);
}

export function renderLoginModal(onSubmit: LoginFunction) {
  throw new Error('not yet implemented');
}