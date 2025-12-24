import { Renderable } from "./Renderable";
import { WorkingChip } from "../application/WorkingChip"
import { PayloadRequiresFullRender, RenderPayload, RenderPayloadUtils } from "./RenderPayloads";
import { WebpageUtils } from "../utils/WebpageUtils";
import { Vector2 } from "../utils/Vector2";
import { Camera } from "./Camera";
import events from "../event/events";
import $ from 'jquery';
import { GeneralUtils } from "../utils/GeneralUtils";

export class RenderManager {
  private workingChip: WorkingChip;

  private camera: Camera;

  private devicePixelRatio = WebpageUtils.calculateDevicePixelRatio();

  private worldSize: Vector2;

  private renderablesById = new Map<string, Renderable>();
  
  private nodeIdToRenderId = new Map<string, string>();
  private renderIdToNodeId = new Map<string, string>();

  private scheduled: boolean = false;
  private fullRenderRequired: boolean = false;

  private gridId?: string;

  private $canvas = $('#canvas');
  private _ctx!: CanvasRenderingContext2D;

  private availabilityGrid: CellTakenBy[][];

  constructor(workingChip: WorkingChip, worldSize: Vector2) {
    this.workingChip = workingChip;
    this.worldSize = worldSize
    this.camera = new Camera(5, 15, 0.001, this.devicePixelRatio, worldSize, this);
    this.setCtx();

    this.availabilityGrid = GeneralUtils.createMatrixOfVals(() => ({ type: undefined, ids: [] }), worldSize.y, worldSize.x);

    console.log(this.availabilityGrid)
 
    $(window).on('resize', () => {
      events.emit('resize');
      this.fitCanvasToPage();
    });

    // send out render requests whenever camera changes or resize occcurs
    events.on('resize', () => this.requestRender({ resize: true }));
    events.on('pan', () => this.requestRender({ camera: true }));
    events.on('zoom', () => this.requestRender({ camera: true }));

    $(document).on('mousemove.gridElementCursor', (e) => this.handleMouseMove(e as JQuery.MouseMoveEvent));

    requestAnimationFrame(() => this.frame());
  }

  public requestRender(payload: RenderPayload) {
    this.scheduled = true;

    // check if any part of the payload requires a full render
    this.fullRenderRequired ||= RenderPayloadUtils.payloadRequiresFullRender(payload);

    // iterate through renderables
    for (const renderable of Object.values(this.renderablesById)) {
      renderable.appendRenderBuffer({ camera: payload.camera, resize: payload.resize });
    }

    // add grid's inital render
    if (payload.initialGrid) {
      // ensure there is a grid
      if (!this.gridId) {
        console.error('please add a grid');
        return;
      }
      const grid = this.renderablesById.get(this.gridId);

      grid?.appendRenderBuffer({
        kind: 'grid',
        initial: payload.initialGrid
      });
    }
    
    // add each grid element's initital renders
    if (payload.initialGridElements) {
      for (const [id, initialPayload] of Object.entries(payload.initialGridElements)) {
        const gridElement = this.renderablesById.get(id);
        gridElement?.appendRenderBuffer({ kind: 'grid-element', initial: initialPayload })
      }
    }

    // add each grid element's movements
    if (payload.gridElementsMovement) {
      for (const [id, movementPayload] of Object.entries(payload.gridElementsMovement)) {
        const gridElement = this.renderablesById.get(id);
        gridElement?.appendRenderBuffer({ kind: 'grid-element', movement: movementPayload.delta })
      }
    }
  }

  private frame() {
    if (!this.scheduled) {
      requestAnimationFrame(() => this.frame());
      return;
    }

    const ctx = this.ctx;
    const windowDims = this.camera.getWindowDims();

    //clear the canvas
    if (this.fullRenderRequired) {
      ctx.clearRect(0, 0, windowDims.x, windowDims.y);
      this.fullRenderRequired = false;
    }

    for (const renderable of this.renderablesById.values()) {
      renderable.render();
    }

    this.scheduled = false;
    requestAnimationFrame(() => this.frame());
  }

  public addRenderable(renderable: Renderable) {
    const id = renderable.id;

    if (renderable.kind === 'grid') {
      this.gridId = id;
    }

    const existing = this.renderablesById.get(id);
    if (existing) {
      throw new Error('id is already in use');
    }
    
    this.renderablesById.set(id, renderable);

    renderable.camera = this.camera;
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
    console.log(pos.x, pos.y )

    return (
      this.availabilityGrid[pos.y][pos.x].type === 'element'
    ); 
  }

  public getWorldSize() {
    return this.worldSize;
  }

  private handleMouseMove(event: JQuery.MouseMoveEvent) {
    const worldPos = this.camera.getWorldPosFromJqueryMouseEvent(event);
    const cell = worldPos.applyFunction(Math.floor);

    const takenBy = this.availabilityGrid[cell.y][cell.x];
    if (takenBy.type === 'element') {
      this.setPointer('move');
    }
  }

  public setPointer(pointerStyle: string) {
    $('#canvas').css('cursor', pointerStyle);
  }
}

interface CellTakenBy {
  type?: 'wire' | 'element',
  ids: string[]
}