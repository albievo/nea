import $ from 'jquery'
import { WebpageUtils } from '../../utils/WebpageUtils';
import { Vector2 } from '../../utils/Vector2';
import events from '../event/events';
import { Camera } from './Camera';
import { MathUtils } from '../../utils/MathUtils';
import { BoundingBox } from './renderables/Renderable';
import { Color } from '../../theme/colors';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = WebpageUtils.calculateDevicePixelRatio();
  private windowDims: Vector2;

  constructor (
    private camera: Camera,
    private $canvas: JQuery<HTMLElement>
  ) {
    this.windowDims = this.calcWindowDims();
    this.ctx = this.setCtx();
    this.fitCanvasToContainer();
    events.on('resize', () => {
      this.fitCanvasToContainer();
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

  private fitCanvasToContainer() {
    const canvas = this.ctx.canvas;
    const dims = this.camera.getContainerDims();

    // set css layout size
    canvas.style.width = `${dims.x}px`;
    canvas.style.height = `${dims.y}px`;

    // set backing buffer size (scaled for dpr)
    canvas.width = Math.floor(dims.x * this.dpr);
    canvas.height = Math.floor(dims.y * this.dpr);

    // reset transform after resize
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private calcWindowDims() {
    return new Vector2(
      $(document).width()! * this.dpr,
      $(document).height()! * this.dpr
    )
  }

  public clearCanvas() {
    const windowDims = this.camera.getContainerDims();
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

      this.ctx.moveTo(fromScreen.x, fromScreen.y);
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

  public drawCenteredText(
    text: string,
    worldCentre: Vector2,
    opts: TextOptions
  ) {
    const centre = this.camera.worldPosToScreen(worldCentre);

    // save so settings don't impact other drawes
    this.ctx.save();

    const fontSize = this.camera.worldUnitsToScreenPixels(opts.fontSize);
    this.ctx.font = `${fontSize}px ${opts.font}`

    if (opts.font) this.ctx.font = opts.font;
    this.ctx.fillStyle = opts.color ?? '#000';

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const maxWidth = this.camera.worldUnitsToScreenPixels(opts.maxWidth);
    const lineHeight = this.camera.worldUnitsToScreenPixels(opts.lineHeight);

    const lines = this.wrapTextToWidth(text, maxWidth);

    const totalHeight = lines.length * lineHeight;

    // y position of the first line's baseline (middle-baseline per line)
    let y = centre.y - (totalHeight / 2) + (lineHeight / 2);

    for (const line of lines) {
      this.ctx.fillText(line, centre.x, y, maxWidth);
      y += lineHeight;
    }

    this.ctx.restore();
  }

  /** Wrap text into lines that fit within maxWidth (screen pixels). */
  private wrapTextToWidth(text: string, maxWidth: number): string[] {
    const lines: string[] = [];

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return lines;

    let current = words[0];

    for (let wordIdx = 1; wordIdx < words.length; wordIdx++) {
      const word = words[wordIdx];
      const next = `${current} ${word}`;

      if (this.ctx.measureText(next).width <= maxWidth) {
        // Still fits on current line
        current = next;
      } else {
        // Current line is complete
        lines.push(current);

        // If the single word itself is too wide, hard-break it
        if (this.ctx.measureText(word).width > maxWidth) {
          const broken = this.breakLongWord(word, maxWidth);

          // All but last chunk become full lines
          lines.push(...broken.slice(0, -1));

          // Last chunk continues as current
          current = broken[broken.length - 1];
        } else {
          current = word;
        }
      }
    }

    // Push final line
    if (current !== '') {
      lines.push(current);
    }

    return lines;
  }

  /** Break a very long word into chunks that fit maxWidth. */
  private breakLongWord(word: string, maxWidth: number): string[] {
    const parts: string[] = [];
    let start = 0;

    while (start < word.length) {
      let end = start + 1;

      // Grow end until it no longer fits
      while (end <= word.length) {
        const slice = word.slice(start, end);
        if (this.ctx.measureText(slice).width > maxWidth) break;
        end++;
      }

      // end is now 1 past the last fitting char, so step back
      const safeEnd = Math.max(start + 1, end - 1);
      parts.push(word.slice(start, safeEnd));
      start = safeEnd;
    }

    return parts;
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

type TextOptions = {
  font: string;              // e.g. "Arial"
  color?: string;             // fillStyle
  maxWidth: number;           // in world units
  lineHeight: number     ;     // in world units
  fontSize: number;           // in world units
};