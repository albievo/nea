import { RenderManager } from "./RenderManager";
import { RenderPayload } from "./RenderPayloads";

export abstract class Renderable {
  protected id: string;
  protected renderManager: RenderManager

  protected abstract $HTMLElem?: JQuery<HTMLElement>;

  public abstract render(payload: RenderPayload): void;

  constructor(id: string, renderManager: RenderManager) {
    this.id = id;
    this.renderManager = renderManager
  }

  public getId() {
    return this.id;
  }
}