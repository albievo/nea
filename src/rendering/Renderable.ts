import events from "../event/events";
import { EventHandlerMap, EventTypes, Handler } from "../event/eventTypes";
import { Camera } from "./Camera";
import { RenderManager } from "./RenderManager";
import { RenderPayload } from "./RenderPayloads";

export abstract class Renderable {
  protected _id: string;
  protected renderManager: RenderManager;
  protected _camera?: Camera;

  protected abstract getEventHandlers(): EventHandlerMap;

  public abstract render(payload: RenderPayload): void;

  constructor(id: string, renderManager: RenderManager) {
    this._id = id;
    this.renderManager = renderManager;

    for (const [type, handler] of Object.entries(this.getEventHandlers()) as [
      EventTypes,
      Handler<any>
    ][]) {
      if (handler) {
        events.on(type, handler);
      }
    }
  }

  public set camera(camera: Camera) {
    this._camera = camera;
  }

  public get id() {
    return this._id;
  }
}