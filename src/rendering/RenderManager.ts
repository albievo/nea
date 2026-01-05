import { Renderable, RenderableKind } from "./Renderable";
import { WorkingChip } from "../application/WorkingChip"
import { WebpageUtils } from "../utils/WebpageUtils";
import { Vector2 } from "../utils/Vector2";
import { Camera } from "./Camera";
import events from "../event/events";
import $ from 'jquery';
import { GeneralUtils } from "../utils/GeneralUtils";
import keyTracker from "./KeyTracker";
import { CursorHandler } from "./CursorHandler";
import { MouseTracker } from "./MouseTracker";
import { MathUtils } from "../utils/MathUtils";

export class RenderManager {
  private workingChip: WorkingChip;

  private _camera: Camera;

  private _cursorHandler: CursorHandler;
  private _mouseTracker: MouseTracker;

  private devicePixelRatio = WebpageUtils.calculateDevicePixelRatio();

  private worldSize: Vector2;

  private renderablesById = new Map<string, Renderable<RenderableKind>>();
  
  private nodeIdToRenderId = new Map<string, string>();
  private renderIdToNodeId = new Map<string, string>();

  private scheduled: boolean = false;

  private gridId?: string;

  private $canvas = $('#canvas');
  private _ctx!: CanvasRenderingContext2D;

  private _availabilityGrid: CellTakenBy[][];

  constructor(workingChip: WorkingChip, worldSize: Vector2) {
    this.workingChip = workingChip;
    this.worldSize = worldSize
    this._camera = new Camera(2, 15, 0.001, this.devicePixelRatio, worldSize, this);
    this.setCtx();

    this._availabilityGrid = GeneralUtils.createMatrixOfVals(() => ({ type: undefined, ids: [] }), worldSize.y, worldSize.x);

    this._mouseTracker = new MouseTracker(this, this.worldSize);
    this._cursorHandler = new CursorHandler(this);

    events.on('render-buffer-updated', () => this.scheduled = true);
 
    $(window).on('resize', () => {
      events.emit('resize');
      this.fitCanvasToPage();
    });

    requestAnimationFrame(() => this.frame());
  }

  private frame() {
    if (!this.scheduled) {
      requestAnimationFrame(() => this.frame());
      return;
    }

    const ctx = this.ctx;
    const windowDims = this.camera.getWindowDims();

    //clear the canvas
    ctx.clearRect(0, 0, windowDims.x, windowDims.y);

    for (const renderable of this.renderablesById.values()) {
      // console.log(`rendering renderable of kind ${renderable.kind} and id ${renderable.id}`);
      renderable.render();
    }

    this.scheduled = false;
    requestAnimationFrame(() => this.frame());
  }

  public addRenderable(renderable: Renderable<RenderableKind>) {
    const id = renderable.id;

    if (renderable.kind === 'grid') {
      this.gridId = id;
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
    
    this.renderablesById.delete(id);
  }

  public getDevicePixelRatio(): number {
    return this.devicePixelRatio;
  }

  private setCtx() {
    const canvas = this.$canvas[0];
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("browser cannot use canvas element")
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Couldn't get 2d context of canvas htmlElement");
    }

    const dpr = this.getDevicePixelRatio()

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.ctx = ctx;

    this.fitCanvasToPage();
  }

  private set ctx(ctx: CanvasRenderingContext2D) {
    this._ctx = ctx;
  }

  public get ctx(): CanvasRenderingContext2D {
    return this._ctx;
  }

  private fitCanvasToPage() {
    const windowDims = this.camera.getWindowDims();

    this.ctx.canvas.width = windowDims.x;
    this.ctx.canvas.height = windowDims.y;
  }

  public addElementToCell(pos: Vector2, id: string) {
    this.availabilityGrid[pos.y][pos.x] = { type: 'element', ids: [id]};
  }

  public addWireToCell(pos: Vector2, id: string) {
    const cellTakenBy = this.availabilityGrid[pos.y][pos.x];

    if (cellTakenBy.type === 'element') return;

    cellTakenBy.type = 'wire';
    cellTakenBy.ids.push(id);
  }

  public rmvElementFromCell(pos: Vector2) {
    this.availabilityGrid[pos.y][pos.x] = { type: undefined, ids: [] };
  }

  public cellHasElement(pos: Vector2): boolean {
    return (
      this.availabilityGrid[pos.y][pos.x].type === 'element'
    ); 
  }

  public getWorldSize() {
    return this.worldSize;
  }

  public drawPolygon(points: Vector2[], color: string) {
    const clockwisePoints = MathUtils.sortPointsClockwise(points);

    this.ctx.beginPath();

    const firstScreen = this.camera.worldPosToScreen(clockwisePoints[0])
    this.ctx.moveTo(firstScreen.x, firstScreen.y);

    for (let pointIdx = 1; pointIdx < 4; pointIdx++) {
      const point = clockwisePoints[pointIdx]
      const pointScreen = this.camera.worldPosToScreen(point);
      this.ctx.lineTo(pointScreen.x, pointScreen.y);
    }

    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  public get camera() {
    return this._camera;
  }
  public get mouseTracker() {
    return this._mouseTracker;
  }
  public get availabilityGrid() {
    return this._availabilityGrid
  }
}

export interface CellTakenBy {
  type?: 'wire' | 'element',
  ids: string[]
}