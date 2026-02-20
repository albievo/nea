import { Camera } from "../rendering/Camera";
import { RenderManager } from "../rendering/RenderManager";
import { InputManager } from "../inputs/InputManager";
import { Vector2 } from "../../utils/Vector2";
import { WebpageUtils } from "../../utils/WebpageUtils";
import { Renderer } from "../rendering/Renderer";
import { WorkingChip } from "../model/WorkingChip";
import { InteractionController } from "../controller/InteractionController";
import { InteractionState } from "../controller/InteractionState";
import { ActionDoer } from "../actions/ActionDoer";
import { GridRenderable } from "../rendering/renderables/GridRenderable";
import { Command } from "./Command";
import { CreateChipElementAction, CreateInputElementAction, CreateOutputElementAction } from "../actions/action-types/CreateElementAction";
import { CursorHandler } from "../rendering/CursorHandler";
import { Value } from "../model/netlist/Value";
import { ChipLibrary, GenericChipDetails, getGenericChipDef } from "../model/chip/ChipLibrary";
import { GhostElementRenderable } from "../rendering/renderables/grid-elements/GhostElementRenderable";
import { NodeType } from "../model/netlist/Netlist";
import { ElementRenderable } from "../rendering/renderables/grid-elements/ElementRenderable";
import { Chip } from "../controller/objectControllers.ts/Chip";
import { EditorUI } from "../../ui/EditorUI";

export interface SuccessState {
  errorText?: string;
}

export class EditorApp {
  private camera: Camera;
  private renderer: Renderer;
  private renderManager: RenderManager;
  private input: InputManager;
  private chip: WorkingChip;
  private interactionState: InteractionState = { inputElements: new Map<string, Value>() };
  private actionDoer: ActionDoer;
  private controller: InteractionController;
  private cursorHandler: CursorHandler;

  private dppr: number = WebpageUtils.calculateDevicePixelRatio();

  constructor(
    private worldSize: Vector2,
    private chipLibrary: ChipLibrary
  ) {
    this.camera = new Camera(
      worldSize,
      this.dppr
    );

    this.renderer = new Renderer(
      this.camera
    )

    this.chip = new WorkingChip(
      worldSize
    )

    this.cursorHandler = new CursorHandler(
      this.interactionState
    );

    this.renderManager = new RenderManager(
      worldSize,
      this.camera,
      this.renderer,
      this.chip,
      this.interactionState
    );

    this.actionDoer = new ActionDoer(
      this.renderManager,
      this.chip,
      this.camera,
      this.interactionState,
      this.chipLibrary
    );

    this.controller = new InteractionController(
      this.renderManager,
      this.actionDoer,
      this.chip,
      this.interactionState,
      this.camera,
      this.cursorHandler,
      this.chipLibrary
    );

    this.input = new InputManager(
      this.camera
    );
  }

  public start() {
    this.renderManager.addRenderable(new GridRenderable(
      crypto.randomUUID(),
      this.chip.worldSize
    ));
  }

  public execute(cmd: Command): SuccessState {
    try {
      switch (cmd.type) {
        case 'add-input-element':
          this.addInputElement(cmd.pos, cmd.id);
          break;

        case 'add-output-element':
          this.addOutputElement(cmd.pos, cmd.id);
          break;

        case 'add-chip-element':
          this.addChipElement(cmd.defId, cmd.pos, cmd.elemId);
          break;

        case 'add-ghost-element':
          this.addGhostElement(cmd.details, cmd.mousePos);
          break;
        
        case 'save-current-chip':
          this.saveCurrentChip();
          break;

        default: {
          const _exhaustive: never = cmd;
          throw new Error(`Unknown command: ${String((cmd as any).type)}`);
        }
      }
    } catch (err) {
      console.error(err);
      return {
        errorText: err
      }
    }

    this.cursorHandler.updateCursor();

    return { }
  }

  private addInputElement(pos: Vector2, id?: string) {
    this.actionDoer.do(new CreateInputElementAction(
      id || crypto.randomUUID(), pos
    ));
  }

  private addOutputElement(pos: Vector2, id?: string) {
    this.actionDoer.do(new CreateOutputElementAction(
      id || crypto.randomUUID(), pos
    ));
  }

  private addChipElement(defId: string, pos: Vector2, elemId?: string) {
    this.actionDoer.do(new CreateChipElementAction(
      elemId || crypto.randomUUID(), defId, pos
    ));
  }

  private addGhostElement(details: GenericChipDetails, mousePos: Vector2) {
    const def = getGenericChipDef(this.chipLibrary, details);
    
    let iconPath: string | undefined;
    
    // figure out the number of inputs and outputs
    let inputs: number;
    let outputs: number;
    if (def) { // if we are looking at a chip
      inputs = def.inputs;
      outputs = def.outputs;
      iconPath = def.icon
    }
    else {
      inputs = details.type === NodeType.INPUT ? 0 : 1;
      outputs = details.type === NodeType.INPUT ? 1 : 0;
    }
    
    const pos = this.camera.screenToWorld(mousePos).applyFunction(Math.floor);
    const dims = ElementRenderable.calcDims(inputs, outputs, 3)
    const validPosition = Chip.checkValidPosition(this.chip, pos, dims);

    this.interactionState.ghostElement = {
      details,
      validPosition,
      renderable: new GhostElementRenderable(
        crypto.randomUUID(),
        details.type,
        inputs,
        outputs,
        pos,
        3,
        'stdElementBackground',
        validPosition,
        iconPath
      )
    }
  }

  private saveCurrentChip() {
    const issue = this.chip.validate();
    
    if (issue) {
      const errorText = `Couldn't save chip: ${issue}`;
      throw new Error(errorText);
    };

    const isStatic = this.chip.isStatic();

    if (!isStatic) {
      throw new Error('Currently only saving static chips has been implemented');
    }

    const equivalent = this.chipLibrary.findEquivalentStaticPrimitive(this.chip.getNetlist().copy());
  }
}