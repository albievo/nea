import { BoundingBox, Renderable, RenderableKind, WireKind } from "./renderables/Renderable";
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
import { GridRenderable } from "./renderables/GridRenderable";
import { TempWire } from "../controller/objectControllers.ts/TempWire";
import { TempWireRenderable } from "./renderables/wires/TempWireRenderable";
import { WireRenderable } from "./renderables/wires/WireRenderable";

export class RenderManager {
  private renderablesById = new Map<string, Renderable<RenderableKind>>();
  private _permWires: string[] = [];

  public previewAvailabilityOverlay: AvailabilityOverlay = new Map<`(${number}, ${number})`, CellTakenBy>();

  public renderState: RenderState;

  private gridRenderable?: GridRenderable;

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

  private frame(renderer: Renderer, model: WorkingChip, interactionState: InteractionState) {
    renderer.clearCanvas();
    this.gridRenderable.fullRender(renderer);

    const rendersRequired = this.computeRendersRequired(this.camera);

    this.renderLayerWithoutWires(renderer, interactionState, rendersRequired, 1);
    this.renderLayerWithoutWires(renderer, interactionState, rendersRequired, 2);
    this.renderLayerWithoutWires(renderer, interactionState, rendersRequired, 3);

    const wireGroups = this.groupWiresByOutput(rendersRequired);
    this.renderWireGroups(renderer, wireGroups);

    const ghost = interactionState.ghostElement?.renderable;
    if (ghost) { ghost.fullRender(renderer); }

    requestAnimationFrame(() => this.frame(renderer, model, interactionState));
  }

  private computeRendersRequired(camera: Camera): Map<string, boolean> {
    const map = new Map<string, boolean>();
    for (const r of this.renderablesById.values()) {
      if (r.kind === 'grid') continue;
      map.set(r.id, camera.intersects(r.getBoundingBox()));
    }
    return map;
  }

  private renderLayerWithoutWires(
    renderer: Renderer,
    interactionState: InteractionState,
    rendersRequired: Map<string, boolean>,
    layer: 1 | 2 | 3
  ) {
    const temp = interactionState.tempWire?.renderable;

    if (temp) {
      if (layer === 1) temp.renderFirstLayer(renderer);
      if (layer === 2) temp.renderSecondLayer(renderer);
      if (layer === 3) temp.renderThirdLayer(renderer);
    }

    for (const r of this.renderablesById.values()) {
      if (r.kind === 'grid' || r.kind === 'perm-wire' || r.kind === 'temp-wire') continue;

      const visible = rendersRequired.get(r.id) === true;
      r.setVisible(visible);
      if (!visible) continue;

      if (layer === 1) r.renderFirstLayer(renderer);
      if (layer === 2) r.renderSecondLayer(renderer);
      if (layer === 3) r.renderThirdLayer(renderer);
    }
  }

  private groupWiresByOutput(
    rendersRequired: Map<string, boolean>
  ): Map<string, Map<number, WireRenderable<'perm-wire' | 'temp-wire'>[]>> {
    const groups = new Map<string, Map<number, WireRenderable<'perm-wire' | 'temp-wire'>[]>>();

    for (const r of this.renderablesById.values()) {
      if (!(r instanceof TempWireRenderable || r instanceof PermWireRenderable)) continue;

      const visible = rendersRequired.get(r.id) === true;
      r.setVisible(visible);
      if (!visible) continue;
      
      const from = r.getFrom();

      let wiresFromNode = groups.get(from.nodeId);
      if (!wiresFromNode) {
        wiresFromNode = new Map<number, PermWireRenderable[]>();
        groups.set(from.nodeId, wiresFromNode);
      }

      const wires = wiresFromNode.get(from.outputIdx);
      if (wires) wires.push(r);
      else wiresFromNode.set(from.outputIdx, [r]);
    }

    return groups;
  }

  private renderWireGroups(
    renderer: Renderer,
    groups: Map<string, Map<number, WireRenderable<'perm-wire' | 'temp-wire'>[]>>
  ) {
    for (const [node, pins] of groups) {
      for (const [pin, wires] of pins) {
        // Same-net merge: all outlines first, then all inners
        for (const w of wires) w.renderSecondLayer(renderer);
        for (const w of wires) w.renderThirdLayer(renderer);
      }
    }
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

    if (renderable instanceof GridRenderable) {
      this.gridRenderable = renderable;
    }
    
    this.renderablesById.set(id, renderable);
  }

  public rmvRenderable(id: string) {
    const renderable = this.renderablesById.get(id);
    if (!renderable) {
      return;
    }

    renderable.deletePersistent();

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

  public getPosOfInputPin(nodeId: string, pinIdx: number): Vector2 {
    const element = this.getGridElementWithId(nodeId);
    if (!element) {
      return Vector2.zeroes;
    }
    
    return element.getInputPos(pinIdx);
  }

  public getPosOfOutputPin(nodeId: string, pinIdx: number): Vector2 {
    const element = this.getGridElementWithId(nodeId);
    if (!element) {
      return Vector2.zeroes;
    }
    
    return element.getOutputPos(pinIdx);
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

  public reset(worldSize: Vector2) {
    for (const [id, renderable] of this.renderablesById) {
      renderable.deletePersistent();
    }
    this.renderablesById.clear();
    this.addRenderable(new GridRenderable(
      crypto.randomUUID(),
      worldSize
    ));
  }
}

export type AvailabilityOverlay = Map<`(${number}, ${number})`, CellTakenBy>;

export interface RenderState {
  wires: Map<string, Value>,
  inputPins: Map<string, Map<number, Value>>,
  outputPins: Map<string, Map<number, Value>>
}