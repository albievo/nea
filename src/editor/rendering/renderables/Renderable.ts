import { Camera } from "../Camera";
import { Renderer } from "../Renderer";
import $ from 'jquery';

export abstract class Renderable<K extends RenderableKind> {
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
    const visible = camera.intersects(this.getBoundingBox());

    // always apply visibility for persistent elements
    this.setVisible(visible);

    // only do the expensive work when visible
    if (!visible) return;

    this.renderObject(renderer);
  }

  /**
   * set the visibility of persistent elements like DOM objects
   */
  protected setVisible(_visible: boolean): void {
    // default: do nothing
  }

  /**
   * delete persistent elements like DOM elemnts
   */
  public deletePersistent(): void {
    // default: do nothing
  }

  public get kind(): K {
    return this._kind;
  }
}

export type RenderableKind = "grid" | ElementKind | WireKind;
export type WireKind = "temp-wire" | "perm-wire";
export type ElementKind = "grid-element" | "ghost-element"

export interface BoundingBox {
  top: number,
  left: number,
  right: number,
  bottom: number
}