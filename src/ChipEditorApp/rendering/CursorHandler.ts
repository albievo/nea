import { InteractionState } from "../controller/InteractionState";
import $ from 'jquery';

export class CursorHandler {

  constructor(
    private state: InteractionState
  ) { }

  private setPointer(pointerStyle: string) {
    $('#canvas').css('cursor', pointerStyle);
  }

  public updateCursor() {
    const panning = this.state.panning !== undefined;
    const tempWire = this.state.tempWire !== undefined;
    const outputPin = this.state.onOutputPin !== undefined;
    const space = this.state.space;
    const mouseOnElement = this.state.onElement !== undefined;
    const draggingElement = this.state.draggingElement !== undefined;
    const inputBtn = this.state.onInputBtn;

    if (panning) {
      this.setPointer('grabbing');
      return;
    }
    if (tempWire) {
      this.setPointer('ew-resize');
      return;
    }
    if (space) {
      this.setPointer('grab');
      return;
    }
    if (inputBtn) {
      this.setPointer('pointer');
      return;
    }
    if (outputPin) {
      this.setPointer('ew-resize');
      return;
    }
    if (mouseOnElement || draggingElement) {
      this.setPointer('move');
      return;
    }
    this.setPointer('default');
  }
}