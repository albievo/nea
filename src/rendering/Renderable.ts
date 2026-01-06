import events from "../event/events";
import { EventHandlerMap, eventTypes, EventTypes, Handler } from "../event/eventTypes";
import { Vector2 } from "../utils/Vector2";
import { Camera } from "./Camera";
import { RenderManager } from "./RenderManager";import { AnyRenderBuffer, RenderBuffer, RenderBufferByKind, RenderBufferUtils } from "./RenderBuffers";
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

  protected abstract updateFromBuffer(): void;
  protected abstract renderObject(): void;
  protected abstract getBoundingBox(): BoundingBox;
  protected abstract resetRenderBuffer(): void;

  protected abstract mergeRenderBuffers(
    original: RenderBufferByKind[K],
    toAdd: RenderBufferByKind[K]
  ): RenderBufferByKind[K];

  constructor(id: string, renderManager: RenderManager) {
    this._id = id;
    this.renderManager = renderManager;

    for (const [type, handler] of Object.entries(this.getEventHandlers()) as [
      EventTypes,
      Handler<any>
    ][]) {
      if (handler) {
        const id = this.generateIdForDefaultListener(type)
        events.on(type, handler, id);
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
      events.emit('render-required');
    }
  }

  protected rmvDefaultListeners() {
    for (const type of eventTypes) {
      const id = this.generateIdForDefaultListener(type)
      events.off(type, id);
    }
  }

  private generateIdForDefaultListener(type: EventTypes) {
    return `default-${type}-listener-${this.id}`;
  }
}

export type RenderableKind = "grid" | "grid-element" | WireKind;
export type WireKind = "temp-wire" | "perm-wire";

export interface BoundingBox {
  top: number,
  left: number,
  right: number,
  bottom: number
}

type SharedRenderBufferFlags = Partial<
  Omit<RenderBuffer, 'kind'>
>;