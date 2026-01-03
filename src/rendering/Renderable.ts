import events from "../event/events";
import { EventHandlerMap, EventTypes, Handler } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { Camera } from "./Camera";
import { RenderManager } from "./RenderManager";
import { AnyRenderBuffer, RenderBuffer, RenderBufferByKind, RenderPayload, RenderPayloadUtils } from "./RenderPayloads";
import $ from 'jquery';

export abstract class Renderable<K extends RenderableKind> {
  protected _id: string;
  protected renderManager: RenderManager;

  protected $canvas: JQuery<HTMLElement> = $('#canvas');

  protected abstract _kind: K;

  protected abstract renderBuffer: RenderBufferByKind[K];

  protected abstract getEventHandlers(): EventHandlerMap;
  protected readonly baseEventHandlers = {
    resize: () => this.appendRenderBuffer({ resize: true }),
    pan: () => this.appendRenderBuffer({ camera: true }),
    zoom: () => this.appendRenderBuffer({ camera: true }),
  };

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

  public get id() {
    return this._id;
  }

  public render() {
    const camera = this.renderManager.camera;

    this.updateFromBuffer();
    
    const boundingBox = this.getBoundingBox();
    if (!camera.intersects(boundingBox)) {
      return;
    }

    this.renderObject();
    this.resetRenderBuffer();
  }

  protected abstract updateFromBuffer(): void;
  protected abstract renderObject(): void;
  protected abstract getBoundingBox(): BoundingBox;
  protected abstract resetRenderBuffer(): void;

  public get kind(): K {
    return this._kind;
  }

  public appendRenderBuffer(payload: SharedRenderBufferFlags): void;
  public appendRenderBuffer(
    payload: Partial<Omit<RenderBufferByKind[K], 'kind'>>
  ): void;

  /**
   * merges new information into the current render buffer
   */
  public appendRenderBuffer(
    payload:
      | SharedRenderBufferFlags
      | Partial<Omit<RenderBufferByKind[K], 'kind'>>
  ) {
    const fullPayloadToAdd = {
      ...payload,
      kind: this.kind,
    } as RenderBufferByKind[K];

    const merged = this.mergeRenderBuffers(
      this.renderBuffer,
      fullPayloadToAdd
    );

    if (merged) {
      this.renderBuffer = merged;
      events.emit('render-buffer-updated');
    }
  }

  protected abstract mergeRenderBuffers(
    original: RenderBufferByKind[K],
    toAdd: RenderBufferByKind[K]
  ): RenderBufferByKind[K];
}

export type RenderableKind = "grid" | "grid-element" | "temp-wire";

export interface BoundingBox {
  top: number,
  left: number,
  right: number,
  bottom: number
}

type SharedRenderBufferFlags = Partial<
  Omit<RenderBuffer, 'kind'>
>;