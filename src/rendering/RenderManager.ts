import { Renderable } from "./Renderable";
import { WorkingChip } from "../application/WorkingChip"
import { RenderPayload, RenderPayloadKind } from "./RenderPayloads";
import { WebpageUtils } from "../utils/WebpageUtils";
import { Vector2 } from "../utils/Vector2";
import { Camera } from "./Camera";
import events from "../event/events";
import $ from 'jquery';

export class RenderManager {
  private workingChip: WorkingChip;

  private camera: Camera;

  private devicePixelRatio = WebpageUtils.calculateDevicePixelRatio();

  private worldSize: Vector2;

  private renderablesById = new Map<string, Renderable>();
  private pending = new Map<string, RenderPayload>();
  
  private nodeIdToRenderId = new Map<string, string>();
  private renderIdToNodeId = new Map<string, string>();

  private scheduled: boolean = false;
  private space: boolean = false;
  private isPanning: boolean = false;

  private $canvas = $('#canvas');
  private _ctx!: CanvasRenderingContext2D;

  constructor(workingChip: WorkingChip, worldSize: Vector2) {
    this.workingChip = workingChip;
    this.worldSize = worldSize
    this.camera = new Camera(5, 15, 0.001, this.devicePixelRatio, worldSize, this);
    this.setCtx();

    $(window).on('resize', () => {
      events.emit('resize');
      this.fitCanvasToPage();
    });

    // track whether space is held down
    $(document).on('keydown.spaceKeyTracker', e => {
      if (e.key === ' ') this.handleSpaceKeyDown();
    });

    events.on('begin-pan', () => { 
      this.isPanning = true;
      this.setPointer('grabbing'); 
    });
    events.on('end-pan', () => {
      this.isPanning = false;
      if (this.space) {
        this.setPointer('grab');
      } else {  
        this.setPointer('default');
      }
    });
  }

  public requestRender(id: string, payload: RenderPayload) {
    // is there an existing render to be completed for this renderable this frame
    const existing = this.pending.get(id);

    // if there is an existing render, merge it with the newest one
    const normalisedPayload = existing
      ? this.mergePayloads(existing, payload, existing.kind)
      : payload;
    this.pending.set(id, normalisedPayload);

    this.requestFlush();
  }

  /**
   * Flush on the next animation frame.
   * Can only happen a max of once per frame, no matter how many times called
   */
  private requestFlush() {
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
        this.scheduled = false
      });
    }
  }

  private mergePayloads(original: RenderPayload, toAdd: RenderPayload, kind: RenderPayloadKind): RenderPayload {
    const newPayload: RenderPayload = {kind};

    // toAdd always comes after the original.
    // It doesn't make sense to run an intial render after other renders have been requested,
    // so throw an error
    if (toAdd.initial) {
      throw new Error("cannot run an initial render after other renders");
    }

    newPayload.camera = original.camera || toAdd.camera;

    // if there is any resizing, new payload should include it
    newPayload.resize = original.resize || toAdd.resize;

    return newPayload;
  }

  private flush() {
    const ctx = this.ctx;
    const windowDims = this.camera.getWindowDims();

    //clear the canvas
    ctx.clearRect(0, 0, windowDims.x, windowDims.y);

    // iterate through pending render payloads
    for (let [id, payload] of this.pending) {
      const renderable = this.renderablesById.get(id);
      if (!renderable) {
        continue;
      }

      renderable.render(payload);
    }

    this.pending.clear();
  }

  public addRenderable(renderable: Renderable) {
    const id = renderable.id;

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

  public setPointer(pointerStyle: string) {
    console.log(`setting pointer to ${pointerStyle}`);
    this.$canvas.css('cursor', pointerStyle);
  }

  public spaceHeld(): boolean {
    return this.space;
  }

  private handleSpaceKeyDown() {
    console.log('space key down');

    if (this.isPanning) {
      this.setPointer('grabbing');
    } else {
      this.setPointer('grab');
    }
    this.space = true;
    $(document).off('keydown.spaceKeyTracker');
    $(document).on('keyup.spaceKeyTracker', e => {
      if (e.key === ' ') {
        this.handleSpaceKeyUp();
      }
    });
  }

  private handleSpaceKeyUp() {
    console.log('space key up');
    // if (this.isPanning) {
    //   this.setPointer('grabbing');
    // }
    if (!this.isPanning) {
      this.setPointer('default');
    }
    this.space = false;
    $(document).off('keyup.spaceKeyTracker');
    $(document).on('keydown.spaceKeyTracker', e => {
      if (e.key === ' ') {
        this.handleSpaceKeyDown();
      }
    });
  }
}
