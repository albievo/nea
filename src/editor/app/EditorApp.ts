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
import { createBehaviour } from "../model/chip/BehaviourSpec";
import { ChipLibrary } from "../model/chip/ChipLibrary";
import { GhostElementRenderable } from "../rendering/renderables/grid-elements/GhostElementRenderable";
import { NodeType } from "../model/netlist/Netlist";

export class EditorApp {
  private camera: Camera;
  private renderer
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
      this.interactionState
    );

    this.controller = new InteractionController(
      this.renderManager,
      this.actionDoer,
      this.chip,
      this.interactionState,
      this.camera,
      this.cursorHandler
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

  public execute(cmd: Command) {
    switch (cmd.type) {
      case 'add-input-element':
        try {
          this.addInputElement(cmd.pos, cmd.id);
        }
        catch (err) {
          console.error(err)
        }
        break;

      case 'add-output-element':
        try {
          this.addOutputElement(cmd.pos, cmd.id);
        }
        catch (err) {
          console.error(err)
        }
        break;

      case 'add-chip-element':
        try {
          this.addChipElement(cmd.defId, cmd.pos, cmd.elemId);
        }
        catch (err) {
          console.error(err)
        }
        break;
      
      case 'add-ghost-chip-element':
        try {
          this.addGhostChipElement(cmd.defId, cmd.mousePos);
        }
        catch (err) {
          console.error(err)
        }
        break;
            
      default: {
        const _exhaustive: never = cmd;
        throw new Error(`Unknown command: ${String((cmd as any).type)}`);
      }
    }
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
    const definition = this.chipLibrary.get(defId);

    const behaviour = createBehaviour(definition.behaviourSpec);
    this.actionDoer.do(new CreateChipElementAction(
      elemId || crypto.randomUUID(), behaviour, pos
    ));
  }

  private addGhostChipElement(defId: string, mousePos: Vector2) {
    const chipDef = this.chipLibrary.get(defId);

    this.interactionState.ghostElement = {
      defId,
      validPosition: true,
      renderable: new GhostElementRenderable(
        crypto.randomUUID(),
        NodeType.CHIP,
        chipDef.inputs,
        chipDef.outputs,
        this.camera.screenToWorld(mousePos).applyFunction(Math.floor),
        3,
        'stdElementBackground',
        true
      )
    }
  }
}