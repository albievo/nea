import { Renderable } from "./Renderable";
import { WorkingChip } from "../application/WorkingChip"
import { AnyRenderPayload, RenderPayload, RenderPayloadMap } from "./RenderPayloads";

export class RenderManager {
  private workingChip: WorkingChip

  private renderablesById = new Map<string, Renderable>();
  private pending = new Map<string, RenderPayload>();
  
  private nodeIdToRenderId = new Map<string, string>();
  private renderIdToNodeId = new Map<string, string>();

  private scheduled = false;

  constructor(workingChip: WorkingChip) {
    this.workingChip = workingChip;
  }

  public requestRender(id: string, payload: RenderPayload) {
    const existing = this.pending.get(id);
    let normalisedPayload: RenderPayload;

    normalisedPayload = existing
      ? this.mergePayloads(existing, payload)
      : payload
    
    this.pending.set(id, normalisedPayload);

    if (!this.scheduled) {
      this.scheduled = true;
      this.flush();
    }
  }

  private mergePayloads(a: RenderPayload, b: RenderPayload): RenderPayload {
    switch (a.kind) {
      case "initial-grid-render": throw new Error('cannot merge inital renders');
    }

    throw new Error('merging this render kind not yet implemented');
  }

  private flush() {
    for (let [id, payload] of this.pending) {
      const renderable = this.renderablesById.get(id);
      if (!renderable) {
        continue;
      }

      renderable.render(payload);
    }
  }

  public addRenderable(renderable: Renderable) {
    const id = renderable.getId();

    const existing = this.renderablesById.get(id);
    if (existing) {
      throw new Error('id is already in use');
    }
    
    this.renderablesById.set(id, renderable);
  }
}
