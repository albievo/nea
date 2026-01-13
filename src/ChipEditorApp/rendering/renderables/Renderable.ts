import { Camera } from "../Camera";
import { Renderer } from "../Renderer";
import $ from 'jquery';
import { RenderState } from "../RenderManager";

export abstract class Renderable<K extends RenderableKind> {
  protected $canvas: JQuery<HTMLElement> = $('#canvas');

  protected abstract _kind: K;

  protected abstract renderObject(renderer: Renderer): void;
  protected abstract getBoundingBox(): BoundingBox;

  constructor(
    private _id: string,
  ) { }

  public get id() {
    return this._id;
  }

  public render(renderer: Renderer, camera: Camera) {
    const boundingBox = this.getBoundingBox();
    if (!camera.intersects(boundingBox)) {
      return;
    }

    this.renderObject(renderer);
  }

  public get kind(): K {
    return this._kind;
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