import { Color, ColorKey, COLORS, hexWithTransparency, valToColor } from "../../../../theme/colors";
import { loadImage } from "../../../../utils/AssetUtils";
import { Vector2 } from "../../../../utils/Vector2";
import { NodeType } from "../../../model/netlist/Netlist";
import { Value } from "../../../model/netlist/Value";
import { Renderer } from "../../Renderer";
import { BoundingBox, ElementKind, Renderable } from "../Renderable";
import editIcon from '../../../../assets/icons/edit.svg';
import $ from 'jquery'


export abstract class ElementRenderable<K extends ElementKind> extends Renderable<K> {
  // -1 means no pin, any other number is the index of the pin
  protected inputPositions!: number[];
  protected outputPositions!: number[];

  protected _dims: Vector2;

  protected readonly INNER_PIN_RADIUS = 0.3;
  public readonly OUTER_PIN_RADIUS = 0.375;

  protected readonly INNER_INDICATOR_RADIUS = 0.8;
  public readonly OUTER_INDICATOR_RADIUS = 0.875;

  private readonly LABEL_TEXT_HEIGHT = 0.3;
  private readonly LABEL_VERT_PADDING = 0.1;
  private readonly LABEL_HOR_PADDING = 0.2

  protected abstract filterColor: ColorKey;
  protected abstract FILTER_OPACITY: number; // 0-1 representing how opaque it should be

  private icon?: HTMLImageElement;

  private $labelContainer?: JQuery<HTMLElement>;

  constructor (
    id: string,
    protected type: NodeType,
    protected inputs: number,
    protected outputs: number,
    protected _pos: Vector2,
    width: number,
    protected color: ColorKey,
    protected iconPath?: string,
    private label?: string
  ) {
    super(id);

    this._dims = ElementRenderable.calcDims(this.inputs, this.outputs, width);
    // make position arrays
    this.calcPinPositions();

    this.initAssets();
  }

  public async initAssets() {
    if (!this.iconPath) return;
    this.icon = await loadImage(this.iconPath);
  }

  public static calcDims(inputs: number, outputs: number, width: number): Vector2 {
    let yDim: number;
    if ( // hard coded to mske common configurations look nicer
      inputs === 2 && outputs === 1 ||
      inputs === 1 && outputs === 2 ||
      inputs === 1 && outputs === 0 ||
      inputs === 0 && outputs === 1
    ) {
      yDim = 3
    }
    else {
      yDim = Math.max(inputs, outputs)
    }

    return new Vector2( width, yDim );
  }

  private calcPinPositions() {
    // hard coded as small so making symmetrical is ok
    if (this.inputs === 1 && this.outputs === 2) {
      this.inputPositions = [-1, 0, -1];
      this.outputPositions = [0, -1, 1];
      return;
    }
    if (this.inputs === 2 && this.outputs === 1) {
      this.inputPositions = [0, -1, 1];
      this.outputPositions = [-1, 0, -1];
      return;
    }
    // hard coded as small so take up a significant amount of space
    if (this.inputs === 0 && this.outputs === 1) {
      this.inputPositions = [-1, -1, -1];
      this.outputPositions = [-1, 0, -1];
      return;
    }
    if (this.inputs === 1 && this.outputs === 0) {
      this.inputPositions = [-1, 0, -1];
      this.outputPositions = [-1, -1, -1];
      return;
    }

    // for most cases, place pins as centrally as possible
    if (this.inputs > this.outputs) {
      // fill up inputs like [0, 1, 2, 3...]
      this.inputPositions = Array.from(
        { length: this.dims.y },
        (_, inputIdx) => inputIdx
      );

      // fill up outputs like [-1, -1, 0, 1, 2, -1, -1]
      const topPadding = Math.floor((this.inputs - this.outputs) / 2);
      this.outputPositions = Array.from(
        { length: this.dims.y },
        (_, idx) => {
          const outputIdx = idx - topPadding;
          return (outputIdx >= 0 && outputIdx < this.outputs) ? outputIdx : -1;
        }
      );
    }

    else {
      // fill up outputs like [0, 1, 2, 3...]
      this.outputPositions = Array.from(
        { length: this.dims.y },
        (_, outputIdx) => outputIdx
      );

      // fill up outputs like [-1, -1, 0, 1, 2, -1, -1]
      const topPadding = Math.floor((this.outputs - this.inputs) / 2);
      this.inputPositions = Array.from(
        { length: this.dims.y },
        (_, idx) => {
          const inputIdx = idx - topPadding;
          return (inputIdx >= 0 && inputIdx < this.inputs) ? inputIdx : -1;
        }
      );
    }
  }

  public getBoundingBox(): BoundingBox {
    return {
      top: this.pos.y,
      left: this.pos.x,
      right: this.pos.x + this.dims.x,
      bottom: this.pos.y + this.dims.y + 1 // adding 1 accounts for label
    }
  }

  protected renderObject(renderer: Renderer) {
    const color = this.color;

    const cornerPositions = [
      this.pos,
      this.pos.add(this.dims.x, 0),
      this.pos.add(0, this.dims.y),
      this.pos.add(this.dims)
    ]

    renderer.drawPolygon(cornerPositions, COLORS[color]);

    if (this.icon) {
      renderer.drawImage(this.icon, this.pos, this.dims);
    }

    // calculate screen radius of pins
    for (let pinIdx = 0; pinIdx < this.dims.y; pinIdx++) {
      const yPos = this.pos.y + pinIdx + 0.5;

      const inputIdx = this.inputPositions[pinIdx]
      // draw the inputs
      if (inputIdx !== -1) { // if we should render a pin here
        const centre = new Vector2(this.pos.x, yPos);
        const val = this.getInputNodeValue(inputIdx);

        this.renderInputPin(renderer, centre, val);
      }

      const outputIdx = this.outputPositions[pinIdx]
      // draw trhe ouputs 
      if (outputIdx !== -1) { // if we should render a pin here
        const xPos = this.pos.x + this.dims.x
        const centre = new Vector2(xPos, yPos);
        const val = this.getOutputNodeValue(outputIdx);

        this.renderOutputPin(renderer, centre, val);
      }
    }

    // draw bits for input and output elements
    const centre = this.pos.add(1.5, 1.5);

    // draw circle for output
    if (this.type === NodeType.OUTPUT) {
      const val = this.getInputNodeValue(0);
      const color = valToColor(val);

      renderer.drawCircle(centre, this.OUTER_INDICATOR_RADIUS, COLORS.outline);
      renderer.drawCircle(centre, this.INNER_INDICATOR_RADIUS, COLORS[color]);
    }

    // draw square for input
    if (this.type === NodeType.INPUT) {
      const val = this.getOutputNodeValue(0);
      const color = valToColor(val);

      const outerBox: BoundingBox = {
        top: centre.y - this.OUTER_INDICATOR_RADIUS,
        right: centre.x + this.OUTER_INDICATOR_RADIUS,
        bottom: centre.y + this.OUTER_INDICATOR_RADIUS,
        left: centre.x - this.OUTER_INDICATOR_RADIUS,
      }
      const innerBox: BoundingBox = {
        top: centre.y - this.INNER_INDICATOR_RADIUS,
        right: centre.x + this.INNER_INDICATOR_RADIUS,
        bottom: centre.y + this.INNER_INDICATOR_RADIUS,
        left: centre.x - this.INNER_INDICATOR_RADIUS,
      }
      renderer.drawRectFromBox(outerBox, COLORS.outline);
      renderer.drawRectFromBox(innerBox, COLORS[color]);
    }

    // add filter color
    const filterHex = hexWithTransparency(this.filterColor, this.FILTER_OPACITY);

    renderer.drawPolygon(
      cornerPositions, 
      filterHex
    );

    // render label, if there is one
    if (this.label) {
      this.renderLabel(renderer);
    }
  }

  protected setVisible(visible: boolean) {
    if (!this.$labelContainer) return;
    this.$labelContainer.toggle(visible);
  }

  private renderInputPin(renderer: Renderer, centre: Vector2, state: Value) {
    const color = valToColor(state);
    renderer.drawSemicircle(
      centre, this.OUTER_PIN_RADIUS, 'right', COLORS['outline']
    );
    renderer.drawSemicircle(
      centre, this.INNER_PIN_RADIUS, 'right', COLORS[color]
    );
  }

  private renderOutputPin(renderer: Renderer, centre: Vector2, state: Value) {
    const color = valToColor(state);
    renderer.drawSemicircle(
      centre, this.OUTER_PIN_RADIUS, 'left', COLORS['outline']
    );
    renderer.drawSemicircle(
      centre, this.INNER_PIN_RADIUS, 'left', COLORS[color]
    );
  }

  /**
   * initial rendering of the label
   */
  private createLabel() {

    const defaultLabel = this.type === NodeType.INPUT
      ? 'Input'
      : 'Output'

    // create label elements

    this.$labelContainer = $('<div>')
      .addClass('label-container');

    const label = $('<div>')
      .addClass('label')
    
    const labelInput = $('<input>')
      .attr({
        'type': 'text',
        'class': 'label-input',
        'value': `${defaultLabel}`,
        'name': 'label-input',
        'maxlength': 31,
        'data-labels': this.id
      });

    const editBtn = $('<button>')
      .addClass('edit-label-btn');

    editBtn.append(
      $('<img>').attr({
        'src': editIcon,
        'alt': 'edit'
      })
    )

    // add element listeners

    editBtn.on('click', () => {
      const inputEl = this.$labelContainer.find('.label-input').get(0) as HTMLInputElement;

      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    });

    labelInput.on('keydown', (e) => {
      if (e.key === 'Enter') {
        labelInput.trigger('blur');
      }
    });

    // add elements to DOM
    
    label.append(labelInput);
    label.append(editBtn);
    this.$labelContainer.append(label);
    $('#labels-layer').append(this.$labelContainer);

    return this.$labelContainer
  }

  /**
   * render the label
   */
  private renderLabel(renderer: Renderer) {
    if (!this.$labelContainer) {
      this.createLabel();
    }
    const camera = renderer.getCamera();

    const centrePos = this.pos.add(this.dims.x / 2, this.dims.y + 0.5);

    const screenTextSize = camera.worldUnitsToScreenPixels(this.LABEL_TEXT_HEIGHT);
    const screenPos = camera.worldPosToScreen(centrePos);

    const screenVerticalPadding = camera.worldUnitsToScreenPixels(this.LABEL_VERT_PADDING);
    const screenHorizontalPadding = camera.worldUnitsToScreenPixels(this.LABEL_HOR_PADDING);

    const screenWidth = camera.worldUnitsToScreenPixels(this.dims.x + 1);

    this.$labelContainer.css({
      'top': `${screenPos.y}px`,
      'left': `${screenPos.x - screenWidth / 2}px`,
      'width': `${screenWidth}px`,
      
      'font-size': `${screenTextSize}px`,
    });

    this.$labelContainer.find('.label').css({
      'padding': `${screenVerticalPadding}px ${screenHorizontalPadding}px`,
    });

    const $labelInput = this.$labelContainer.find('.label-input');

    $labelInput.css({'width': '0px'});
    $labelInput.css({
      'width': Math.max($labelInput.get(0).scrollWidth, 20) + 'px'
    });
  }

  public setLabel(text: string) {
    const $labelContainer = this.$labelContainer;
    if (!$labelContainer) return;

    $labelContainer.find('.label-input').val(text);
  }

  protected abstract getInputNodeValue(inputIdx: number): Value;
  protected abstract getOutputNodeValue(outputIdx: number): Value;

  public get pos(): Vector2 {
    return this._pos.fixedCopy();
  }
  public set pos(pos: Vector2) {
    this._pos = pos;
  }
  public get dims(): Vector2 {
    return this._dims.fixedCopy();
  }
  private set dims(dims: Vector2) {
    this._dims = dims;
  }
}