import { Camera } from "./Camera";
import { RenderManager } from "./RenderManager";
import { RenderPayload } from "./RenderPayloads";

export abstract class Renderable {
  protected id: string;
  protected renderManager: RenderManager;
  protected camera?: Camera;

  protected abstract $HTMLElem?: JQuery<HTMLElement>;

  public abstract render(payload: RenderPayload): void;

  constructor(id: string, renderManager: RenderManager) {
    this.id = id;
    this.renderManager = renderManager;
  }

  public setCamera(camera: Camera) {
    this.camera = camera;
  }

  public getId() {
    return this.id;
  }
}