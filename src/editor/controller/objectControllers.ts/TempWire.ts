import { RenderManager } from "../../rendering/RenderManager";

export class TempWire {
  public static deleteTempWire(
    id: string,
    renderManager: RenderManager
  ) {
    renderManager.rmvRenderable(id);
  }
}