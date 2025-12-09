import { EventHandlerMap } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { Renderable } from "./Renderable";
import { RenderManager } from "./RenderManager";
import { GridElementPayload, InitialGridElementPayload } from "./RenderPayloads";
import $ from 'jquery';

export class GridElement extends Renderable {
  private $canvas: JQuery<HTMLElement>;

  // in world units
  private dims: Vector2;
  private pos: Vector2;

  private colour?: string;

  constructor(
    id: string,
    renderManager: RenderManager,
    pos: Vector2, dims: Vector2,
  ) {
    super(id, renderManager);

    this.dims = dims.fixedCopy();
    this.pos = pos.copy();
    this.$canvas = $('#canvas');
  }

  public render(payload: GridElementPayload): void {
    if (payload.initial) this.initialRender(payload.initial);

    this.renderElement();
  }

  private initialRender(payload: InitialGridElementPayload) {
    this.colour = payload.color;
  }

  private renderElement() {
    const camera = this.camera
    if (!camera) {
      throw new Error ('please set a camera before rendering')
    }

    const isOnScreen = this.isOnScreen();
    if (!isOnScreen) {
      return;
    }

    console.log(isOnScreen);
  }

  private isOnScreen(): boolean {
    const camera = this.camera
    if (!camera) {
      throw new Error ('please set a camera to check if the element is on screen')
    }

    const bottomRight = this.pos.add(this.dims);

    return camera.isOnScreen(this.pos) || camera.isOnScreen(bottomRight);
  } 

  protected getEventHandlers(): EventHandlerMap {
    return {};
  };
}