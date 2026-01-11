import $ from 'jquery'
import { WebpageUtils } from '../../utils/WebpageUtils';
import { Vector2 } from '../../utils/Vector2';
import events from '../event/events';
import { Camera } from './Camera';
import { MathUtils } from '../../utils/MathUtils';
import { BoundingBox } from './renderables/Renderable';

export class Renderer {
  private $canvas = $('canvas');
  private ctx: CanvasRenderingContext2D;
  private dpr = WebpageUtils.calculateDevicePixelRatio();
  private windowDims: Vector2;

  constructor (
    private camera: Camera
  ) {
    this.windowDims = this.calcWindowDims();
    this.ctx = this.setCtx();
    this.fitCanvasToPage();
    events.on('resize', () => {
      this.fitCanvasToPage();
    })
  }

  private setCtx(): CanvasRenderingContext2D {
    const canvas = this.$canvas[0];
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("browser cannot use canvas element")
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Couldn't get 2d context of canvas htmlElement");
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    return ctx;
  }


  private fitCanvasToPage() {
    console.log('fitting canvas to page');
    this.ctx.canvas.width = this.windowDims.x;
    this.ctx.canvas.height = this.windowDims.y;
  }

  private calcWindowDims() {
    return new Vector2(
      $(document).width()! * this.dpr,
      $(document).height()! * this.dpr
    )
  }

  public clearCanvas() {
    const windowDims = this.camera.getWindowDims();
    //clear the canvas
    this.ctx.clearRect(0, 0, windowDims.x, windowDims.y);
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

  public drawLine(line: Line, color: string) {
    this.ctx.beginPath();

    const fromScreen = this.camera.worldPosToScreen(line.from);
    const toScreen = this.camera.worldPosToScreen(line.to);

    this.ctx.moveTo(fromScreen.x, fromScreen.y);
    this.ctx.lineTo(toScreen.x, toScreen.y);

    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  public drawLines(lines: Line[], color: string) {
    this.ctx.beginPath();

    for (const line of lines) {
      const fromScreen = this.camera.worldPosToScreen(line.from);
      const toScreen = this.camera.worldPosToScreen(line.to);

      this.ctx.moveTo(fromScreen.x, toScreen.y);
      this.ctx.lineTo(toScreen.x, toScreen.y);
    }

    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  public drawSemicircle(
    centre: Vector2, radius: number,
    direction: Direction, 
    color: string
  ) {
    const centreScreen = this.camera.worldPosToScreen(centre);
    const radiusScreen = this.camera.worldUnitsToScreenPixels(radius);
    const angles = this.getRotationRange(direction);
    
    this.ctx.beginPath();
    this.ctx.arc(
      centreScreen.x + 1, centreScreen.y,
      radiusScreen,
      angles[0], angles[1]
    )

    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  public getScreenBoundingBox(): BoundingBox {
    const pan = this.camera.getPan();
    const dims = this.camera.calcWorldUnitsOnScreen();

    return {
      top: pan.y,
      left: pan.x,
      bottom: pan.y + dims.y,
      right: pan.x + dims.x
    }
  }

  private getRotationRange(direction: Direction): RotationRange {
    return directionRotations[direction];  
  }

  public getWindowDims(): Vector2 { return this.windowDims }
  public getCamera(): Camera { return this.camera };
}

interface Line {
  from: Vector2,
  to: Vector2
}

type Direction = 'up' | 'right' | 'down' | 'left';

type RotationRange = readonly [number, number];

const directionRotations: Record<Direction, RotationRange> = {
  up: [-Math.PI, 0],
  right: [Math.PI / 2, Math.PI * 3 / 2],
  down: [0, -Math.PI],
  left: [-Math.PI / 2, Math.PI / 2],
};