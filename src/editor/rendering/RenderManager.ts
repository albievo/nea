import { BoundingBox, Renderable, RenderableKind } from "./renderables/Renderable";
import { Vector2 } from "../../utils/Vector2";
import { Camera } from "./Camera";
import { isGridElementRenderable, isPermWireRenderable, isTempWireRenderable } from "./RenderableTypeGuards";
import { GridElementRenderable } from "./renderables/grid-elements/GridElementRenderable";
import { Renderer } from "./Renderer";
import { CellTakenBy, WorkingChip } from "../model/WorkingChip";
import { InteractionState } from "../controller/InteractionState";
import { GeneralUtils } from "../../utils/GeneralUtils";
import { PermWireRenderable } from "./renderables/wires/PermWireRenderable";
import { Value } from "../model/netlist/Value";
import { createEmptyRenderState } from "./RenderState";

export class RenderManager {
  private renderablesById = new Map<string, Renderable<RenderableKind>>();
  private _permWires: string[] = [];

  public previewAvailabilityOverlay: AvailabilityOverlay = new Map<`(${number}, ${number})`, CellTakenBy>();

  public renderState: RenderState;

  constructor(
    private worldSize: Vector2,
    private _camera: Camera,
    private renderer: Renderer,
    private model: WorkingChip,
    private interactionState: InteractionState
  ) {
    this.renderState = createEmptyRenderState();

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
    if (interactionState.ghostElement) {
      interactionState.ghostElement.renderable.render(renderer, this.camera);
    }

    requestAnimationFrame(() => this.frame(
      renderer,
      model,
      interactionState
    ));
  }

  public addRenderable(renderable: Renderable<RenderableKind>) {
    const id = renderable.id;

    if (renderable.kind === 'perm-wire') {
      this._permWires.push(id);
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

    if (renderable.kind === 'perm-wire') {
      GeneralUtils.removeValue(this._permWires, id);
    }
    
    this.renderablesById.delete(id);
  }

  public getWorldSize() {
    return this.worldSize;
  }

  public get camera() {
    return this._camera;
  }

  public getRenderableWithId(id: string) {
    return this.renderablesById.get(id);
  }

  public getOutputIdxsOfElementWithId(id: string): {pos: number, idx: number}[] {
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

    return element.OUTER_PIN_RADIUS;
  }

  public getIndicatorRadiusOfElement(id: string): number {
    const element = this.getGridElementWithId(id);

    if (!element) {
      return -1;
    }

    return element.OUTER_INDICATOR_RADIUS;
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

  public getPermWireWithId(id: string): PermWireRenderable | null {
    const element = this.renderablesById.get(id);

    if (!isPermWireRenderable(element)) {
      return null;
    }

    return element;
  }

  public get permWires() {
    return this._permWires;
  }

  public moveGridElementPreview(id: string, to: Vector2) {
    const element = this.getGridElementWithId(id);
    if (!element) return;

    this.rmvPreviewElementFromCellInBox({
      top: element.pos.y, bottom: element.pos.y + element.dims.y - 1,
      left: element.pos.x, right: element.pos.x + element.dims.x - 1
    })

    element.pos = to.fixedCopy();

    this.addPreviewElementToCellInBox(id, {
      top: element.pos.y, bottom: element.pos.y + element.dims.y - 1,
      left: element.pos.x, right: element.pos.x + element.dims.x - 1
    });
  }

  public previewMatchesCanon() {
    this.previewAvailabilityOverlay.clear();
  }

  private addPreviewElementToCellInBox(id: string, bb: BoundingBox) {
    for (let x = bb.left; x <= bb.right; x++) {
      for (let y = bb.top; y <= bb.bottom; y++) {
        const cell = new Vector2(x, y)
        this.previewAvailabilityOverlay.set(
          cell.toString(), { type: 'element', ids: [id] }
        );
      }
    }
  }

  private rmvPreviewElementFromCellInBox(bb: BoundingBox) {
    for (let x = bb.left; x <= bb.right; x++) {
      for (let y = bb.top; y <= bb.bottom; y++) {
        const cell = new Vector2(x, y)
        this.previewAvailabilityOverlay.set(
          cell.toString(), { type: 'none', ids: [] }
        );
      }
    }
  }

  /**
   * this is pretty rough, could be improved by being passed a list of changes instead,
   * but works for now
   */
  public updateRenderState(newState: RenderState) {
    this.renderState.wires = newState.wires;
    this.renderState.inputPins = newState.inputPins;
    this.renderState.outputPins = newState.outputPins;
  }

  public setElemLabel(id: string, text: string) {
    const elem = this.getGridElementWithId(id);
    if (!elem) return;

    elem.setLabel(text);
  }
}

export type AvailabilityOverlay = Map<`(${number}, ${number})`, CellTakenBy>;

export interface RenderState {
  wires: Map<string, Value>,
  inputPins: Map<string, Map<number, Value>>,
  outputPins: Map<string, Map<number, Value>>
}