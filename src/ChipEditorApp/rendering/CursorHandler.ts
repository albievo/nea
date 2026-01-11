// import events from "../event/events";
// import inputState from "../inputs/InputState";
// import { RenderManager } from "./RenderManager"
// import $ from 'jquery';

// export class CursorHandler {

//   private readonly renderManager: RenderManager;

//   constructor(renderManager: RenderManager) {
//     this.renderManager = renderManager;

//     events.on('begin-pan', () => this.updateCursor());
//     events.on('end-pan', () =>  this.updateCursor());
//     events.on('space-down', () => this.updateCursor());
//     events.on('space-up', () => this.updateCursor());
//     events.on('mouse-moved-into-element', () => this.updateCursor());
//     events.on('mouse-moved-off-element', () => this.updateCursor());
//   }

//   private setPointer(pointerStyle: string) {
//     $('#canvas').css('cursor', pointerStyle);
//   }
//   private updateCursor() {
//     const panning = this.renderManager.camera.isPanning;
//     const space = inputState.space;
//     const mouseOnElement = this.renderManager.mouseTracker.isOnElement;

//     if (panning) {
//       this.setPointer('grabbing');
//       return;
//     }
//     if (space) {
//       this.setPointer('grab');
//       return;
//     }
//     if (mouseOnElement) {
//       this.setPointer('move');
//       return;
//     }
//     this.setPointer('default');
//   }
// }