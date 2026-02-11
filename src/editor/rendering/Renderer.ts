import $ from 'jquery'
import { WebpageUtils } from '../../utils/WebpageUtils';
import { Vector2 } from '../../utils/Vector2';
import events from '../event/events';
import { Camera } from './Camera';
import { MathUtils } from '../../utils/MathUtils';
import { BoundingBox } from './renderables/Renderable';
import { Color } from '../../theme/colors';

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
    const canvas = this.ctx.canvas;

    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    // CSS size (layout size — prevents scrollbars)
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Drawing buffer size (actual resolution)
    canvas.width = Math.floor(cssWidth * this.dpr);
    canvas.height = Math.floor(cssHeight * this.dpr);

    // Reset transform after resize
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
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
    const { start, end, anticlockwise } = this.getRotationRange(direction);

    this.ctx.beginPath();
    this.ctx.arc(
      centreScreen.x,
      centreScreen.y,
      radiusScreen,
      start,
      end,
      anticlockwise
    );

    this.ctx.fillStyle = color
    this.ctx.fill();
  }

  public drawCircle(centre: Vector2, radius: number, color: Color) {
    const centreScreen = this.camera.worldPosToScreen(centre);
    const radiusScreen = this.camera.worldUnitsToScreenPixels(radius);

    this.ctx.beginPath();
    this.ctx.arc(
      centreScreen.x, centreScreen.y,
      radiusScreen,
      0, Math.PI * 2,
    );

    this.ctx.fillStyle = color
    this.ctx.fill();
  }

  public drawImage(
    img: CanvasImageSource,
    pos: Vector2, dims: Vector2
    ) {
    const screenPos = this.camera.worldPosToScreen(pos);
    const screenDims = dims.applyFunction(n => this.camera.worldUnitsToScreenPixels(n));

    this.ctx.drawImage(img, screenPos.x, screenPos.y, screenDims.x, screenDims.y);
  }

  public drawRectFromBox(box: BoundingBox, color: string) {

    const topLeft = this.camera.worldPosToScreen(new Vector2(box.left, box.top));
    const bottomRight = this.camera.worldPosToScreen(new Vector2(box.right, box.bottom));

    const w = bottomRight.x - topLeft.x;
    const h = bottomRight.y - topLeft.y;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(topLeft.x, topLeft.y, w, h);
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

  public drawCenteredText(text: string, leftPos: Vector2, height: number, width?: number) {
    const screenWidth = this.camera.worldUnitsToScreenPixels(width ?? 100);
    const screenHeight = this.camera.worldUnitsToScreenPixels(height);

    const screenPos = this.camera.worldPosToScreen(leftPos).add(0, screenHeight / 2);

    this.ctx.font = `${screenHeight}px Arial`;        // font size + family
    this.ctx.fillStyle = 'black';        // text color
    this.ctx.textAlign = 'center';         // horizontal alignment
    this.ctx.textBaseline = 'alphabetic';// vertical alignment

    this.ctx.fillText(text, screenPos.x, screenPos.y, screenWidth);
  }
}

interface Line {
  from: Vector2,
  to: Vector2
}

type Direction = 'up' | 'right' | 'down' | 'left';

type RotationRange = {
  start: number;
  end: number;
  anticlockwise: boolean;
};

const directionRotations: Record<Direction, RotationRange> = {
  up:    { start: Math.PI, end: 0, anticlockwise: false },
  right: { start: -Math.PI / 2, end: Math.PI / 2, anticlockwise: false },
  down:  { start: 0, end: Math.PI, anticlockwise: false },
  left:  { start: Math.PI / 2, end: -Math.PI / 2, anticlockwise: false },
};
