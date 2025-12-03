import { Renderable } from "./Renderable";
import { WorkingChip } from "../application/WorkingChip"
import { RenderPayload } from "./RenderPayloads";
import { WebpageUtils } from "../utils/WebpageUtils";
import { Vector2 } from "../utils/Vector2";
import { Camera } from "./Camera";

export class RenderManager {
  private workingChip: WorkingChip;

  private camera: Camera;

  private devicePixelRatio = WebpageUtils.calculateDevicePixelRatio();

  private worldSize: Vector2;

  private renderablesById = new Map<string, Renderable>();
  private pending = new Map<string, RenderPayload>();
  
  private nodeIdToRenderId = new Map<string, string>();
  private renderIdToNodeId = new Map<string, string>();

  private scheduled = false;

  constructor(workingChip: WorkingChip, worldSize: Vector2) {
    this.workingChip = workingChip;
    this.worldSize = worldSize
    this.camera = new Camera(5, Vector2.origin, this.devicePixelRatio, 15, 0.001);
  }

  public requestRender(id: string, payload: RenderPayload) {
    // is there an existing render to be completed for this renderable this frame
    const existing = this.pending.get(id);

    // if there is an existing render, merge it with the newest one
    const normalisedPayload = existing
      ? this.mergePayloads(existing, payload)
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

  private mergePayloads(original: RenderPayload, toAdd: RenderPayload): RenderPayload {
    const newPayload: RenderPayload = {};

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
    const id = renderable.getId();

    const existing = this.renderablesById.get(id);
    if (existing) {
      throw new Error('id is already in use');
    }
    
    this.renderablesById.set(id, renderable);

    renderable.setCamera(this.camera);
  }

  public getDevicePixelRatio(): number {
    return this.devicePixelRatio;
  }
}
