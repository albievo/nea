import events from "../event/events";
import { EventHandlerMap, EventTypes, Handler } from "../event/eventTypes";
import { Camera } from "./Camera";
import { RenderManager } from "./RenderManager";
import { AnyRenderBuffer, RenderBuffer, RenderPayload, RenderPayloadUtils } from "./RenderPayloads";
import $ from 'jquery';

export abstract class Renderable {
  protected _id: string;
  protected renderManager: RenderManager;
  protected _camera?: Camera;

  protected $canvas: JQuery<HTMLElement> = $('#canvas');

  protected abstract renderBuffer: RenderBuffer;

  protected abstract _kind: RenderableKind;

  protected abstract getEventHandlers(): EventHandlerMap;

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
  public get camera(): Camera | undefined {
    return this._camera;
  }

  public get id() {
    return this._id;
  }

  public render() {
    this.updateFromBuffer();
    this.renderObject();
    this.renderBuffer = { kind: this.kind };
  }

  protected abstract updateFromBuffer(): void;
  protected abstract renderObject(): void;

  public get kind() {
    return this._kind;
  }

  /**
   * merges new information into the current render buffer
   * @param newPayload should be of the same type as the class
   */
  public appendRenderBuffer(newPayload: AnyRenderBuffer) {
    const newRenderBuffer = RenderPayloadUtils.mergeRenderBuffers(this.renderBuffer, newPayload);
    if (newRenderBuffer) {
      this.renderBuffer = newPayload
    }
  }
}

export type RenderableKind = "grid" | "grid-element"