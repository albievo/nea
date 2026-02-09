import $ from 'jquery';

export type ModalDescriptor = 
  | { type: 'plain-text', title: string, props: { text: string } }

export function renderEmptyModal(title: string) {
  const $overlay = $('<div>')
    .addClass('modal-overlay');

  const $modal = $(`
    <div class='modal'>
      <div class='modal-title'>
        <h2>${title}</h2>
      </div>
      <div class='modal-body'></div>
    </div>`
  );

  $overlay.append($modal);
  $('#ui').append($overlay);
}