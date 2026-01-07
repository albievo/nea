import events from "../event/events";
import { EventHandlerMap } from "../event/eventTypes";
import { BoundingBox, Renderable, RenderableKind } from "./Renderable";
import { RenderManager } from "./RenderManager";
import $ from 'jquery';
import { Vector2 } from "../../utils/Vector2";

export class Grid extends Renderable<'grid'> {
  protected _kind = 'grid' as const;

  private ctx: CanvasRenderingContext2D;

  private size: Vector2;
  
  constructor(id: string, renderManager: RenderManager, size: Vector2) {
    super(id, renderManager);

    this.size = size;
    this.ctx = this.renderManager.ctx;
  }

  protected getBoundingBox(): BoundingBox {
    return {
      top: 0,
      left: 0,
      right: this.size.x + 1,
      bottom: this.size.y + 1 
    }
  }

  protected getEventHandlers(): EventHandlerMap {
    return {
      ...this.baseEventHandlers
    }
  }

  protected renderObject() {
    const camera = this.renderManager.camera
    const ctx = this.ctx;

    const windowDims = camera.getWindowDims();
    
    const cellDimScreen = camera.worldUnitsToScreenPixels(1);

    const linesToDraw = camera.calcWorldUnitsOnScreen().add(1);

    // calculate offset
    const offsetWorld = camera.getPan().applyFunction(n => n % 1);
    const offsetScreen = offsetWorld.applyFunction(n => camera.worldUnitsToScreenPixels(n));
    
    ctx.beginPath();

    //draw rows
    for (let row = 0; row < linesToDraw.y; row++) {
      const rowY = row * cellDimScreen - offsetScreen.y;

      ctx.moveTo(0, rowY);
      ctx.lineTo(windowDims.x, rowY);
    }

    //draw columns
    for (let col: number = 0; col < linesToDraw.x; col++) {
      const colX = col * cellDimScreen - offsetScreen.x;

      ctx.moveTo(colX, 0);
      ctx.lineTo(colX, windowDims.y);
    }
    
    ctx.stroke();
  }
}