// import { Vector2 } from "../utils/Vector2";
// import { Renderable } from "./Renderable";
// import { RenderManager } from "./RenderManager";
// import { GridElementPayload, InitialGridElementPayload } from "./RenderPayloads";

// export class GridElement extends Renderable {
//   protected $HTMLElem?: JQuery<HTMLElement>;

//   // in grid cells
//   private dims: Vector2;
//   private pos: Vector2;

//   private pixelDims: Vector2;

//   constructor(
//     id: string,
//     renderManager: RenderManager,
//     pos: Vector2,
//     dims: Vector2
//   ) {
//     super(id, renderManager);
//     this.pos = pos.copy();
//     this.dims = dims.copy();
//     this.pixelDims = this.calculatePixelDims();
//   }

//   public render(payload: GridElementPayload): void {
//     if (payload.initial) this.initialRender(payload.initial);
//   }

//   private initialRender(payload: InitialGridElementPayload) {
//     this.$HTMLElem = $('<div class="grid-element"></div>');
//     this.$HTMLElem.css('background-color', payload.color);
//   }

//   private calculate
// }