import { Renderable, RenderableKind } from "./renderables/Renderable";
import { Vector2 } from "../../utils/Vector2";
import { Camera } from "./Camera";
import { MouseTracker } from "./MouseTracker";
import { isGridElementRenderable, isTempWireRenderable } from "./RenderableTypeGuards";
import { GridElementRenderable } from "./renderables/GridElementRenderable";
import { Renderer } from "./Renderer";
import { WorkingChip } from "../model/WorkingChip";
import { InteractionState } from "../controller/InteractionState";

export class RenderManager {
  private _mouseTracker: MouseTracker;

  private renderablesById = new Map<string, Renderable<RenderableKind>>();

  private gridId?: string;
  private _tempWireId?: string;

  constructor(
    private worldSize: Vector2,
    private _camera: Camera,
    private renderer: Renderer,
    private model: WorkingChip,
    private interactionState: InteractionState
  ) {
    this._mouseTracker = new MouseTracker(this, this.worldSize);

    requestAnimationFrame(() => this.frame(
      this.renderer,
      this.model,
      this.interactionState
    ));
  }

  private frame(
    renderer: Renderer,
    model: WorkingChip,
    interactionState: InteractionState
  ) {
    this.renderer.clearCanvas();

    for (const renderable of this.renderablesById.values()) {
      renderable.render(renderer, this.camera);
    }
    if (interactionState.tempWire) {
      interactionState.tempWire.renderable.render(renderer, this.camera);
    }

    requestAnimationFrame(() => this.frame(
      renderer,
      model,
      interactionState
    ));
  }

  public addRenderable(renderable: Renderable<RenderableKind>) {
    const id = renderable.id;

    if (renderable.kind === 'grid') {
      this.gridId = id;
    }
    else if (renderable.kind === 'temp-wire') {
      this._tempWireId = id;
    }

    const existing = this.renderablesById.get(id);
    if (existing) {
      throw new Error('id is already in use');
    }
    
    this.renderablesById.set(id, renderable);
  }

  public rmvRenderable(id: string) {
    const renderable = this.renderablesById.get(id);
    if (!renderable) {
      return
    }

    if (renderable.kind === 'grid') {
      this.gridId = undefined;
    }
    if (renderable.kind === 'temp-wire') {
      this._tempWireId = undefined;
    }
    
    this.renderablesById.delete(id);
  }

  public getWorldSize() {
    return this.worldSize;
  }

  public get camera() {
    return this._camera;
  }
  public get mouseTracker() {
    return this._mouseTracker;
  }

  public getRenderableWithId(id: string) {
    return this.renderablesById.get(id);
  }

  public getOutputIdxsOfElementWithId(id: string): number[] {
    const element = this.getGridElementWithId(id);

    if (!element) {
      return [];
    }

    return element.getOutputPositions();
  }

  public getPinRadiusOfElement(id: string): number {
    const element = this.getGridElementWithId(id);

    if (!element) {
      return -1;
    }

    return element.PIN_RADIUS;
  }

  public getPositionOfElement(id: string): Vector2 {
    const element = this.getGridElementWithId(id);

    if (!element) {
      return Vector2.zeroes;
    }

    return element.pos;
  }

  public getDimsOfElement(id: string): Vector2 {
    const element = this.getGridElementWithId(id);

    if (!element) {
      return Vector2.zeroes;
    }

    return element.dims;
  }

  public inputPinAtPos(id: string, pos: number): number {
    const element = this.getGridElementWithId(id);

    if (!element) {
      return -1;
    }

    return element.inputAtPos(pos);
  }

  public getGridElementWithId(id: string): GridElementRenderable | null {
    const element = this.renderablesById.get(id);

    if (!isGridElementRenderable(element)) {
      return null;
    }

    return element;
  }
}