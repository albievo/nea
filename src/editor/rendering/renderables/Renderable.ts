import { Renderer } from "../Renderer";

export abstract class Renderable<K extends RenderableKind> {
  protected abstract _kind: K;

    public abstract renderFirstLayer(renderer: Renderer): void;
    public abstract renderSecondLayer(renderer: Renderer): void;
    public abstract renderThirdLayer(renderer: Renderer): void;

    public abstract getBoundingBox(): BoundingBox;

  constructor(
    private _id: string,
  ) { }

  public get id() {
    return this._id;
  }

  /**
   * set the visibility of persistent elements like DOM objects
   */
  public setVisible(_visible: boolean): void {
    // default: do nothing
  }

  public fullRender(renderer: Renderer) {
    this.renderFirstLayer(renderer);
    this.renderSecondLayer(renderer);
    this.renderThirdLayer(renderer);
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