import events from "../event/events";
import { EventHandlerMap, eventTypes, EventTypes, Handler } from "../event/eventTypes";
import { Vector2 } from "../../utils/Vector2";
import { Camera } from "./Camera";
import { RenderManager } from "./RenderManager";
import $ from 'jquery';

export abstract class Renderable<K extends RenderableKind> {
  protected _id: string;
  protected renderManager: RenderManager;

  protected $canvas: JQuery<HTMLElement> = $('#canvas');

  protected abstract _kind: K;

  protected abstract getEventHandlers(): EventHandlerMap;
  protected readonly baseEventHandlers = {
    resize: () => events.emit('render-required'),
    pan: () => events.emit('render-required'),
    zoom: () => events.emit('render-required'),
  };

  protected abstract renderObject(): void;
  protected abstract getBoundingBox(): BoundingBox;

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
    
    const boundingBox = this.getBoundingBox();
    if (!camera.intersects(boundingBox)) {
      return;
    }

    this.renderObject();
  }

  public get kind(): K {
    return this._kind;
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