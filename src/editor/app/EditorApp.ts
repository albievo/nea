import { Camera } from "../rendering/Camera";
import { RenderManager } from "../rendering/RenderManager";
import { InputManager } from "../inputs/InputManager";
import { Vector2 } from "../../utils/Vector2";
import { WebpageUtils } from "../../utils/WebpageUtils";
import { Renderer } from "../rendering/Renderer";
import { WorkingChip } from "../model/WorkingChip";
import { InteractionController } from "../controller/InteractionController";
import { createEmptyInteractionState, emptyInteractionState, InteractionState } from "../controller/InteractionState";
import { ActionDoer } from "../actions/ActionDoer";
import { GridRenderable } from "../rendering/renderables/GridRenderable";
import { Command } from "./Command";
import { CreateChipElementAction, CreateInputElementAction, CreateOutputElementAction } from "../actions/action-types/CreateElementAction";
import { CursorHandler } from "../rendering/CursorHandler";
import { Value } from "../model/netlist/Value";
import { ChipDefinition, ChipLibrary, GenericChipDetails, getGenericChipDef } from "../model/chip/ChipLibrary";
import { GhostElementRenderable } from "../rendering/renderables/grid-elements/GhostElementRenderable";
import { NodeType } from "../model/netlist/Netlist";
import { ElementRenderable } from "../rendering/renderables/grid-elements/ElementRenderable";
import { Chip } from "../controller/objectControllers.ts/Chip";
import { EditorUI } from "../../ui/EditorUI";
import { Sidebar } from "../../ui/sidebar/Sidebar";
import { NetlistBehaviour, TruthtableBehaviour } from "../model/chip/ChipBehaviour";

export interface SuccessState {
  errorText?: string;
}

export class EditorApp {
  private camera: Camera;
  private renderer: Renderer;
  private renderManager: RenderManager;
  private input: InputManager;
  private chip: WorkingChip;
  private interactionState: InteractionState;
  private actionDoer: ActionDoer;
  private controller: InteractionController;
  private cursorHandler: CursorHandler;

  private dppr: number = WebpageUtils.calculateDevicePixelRatio();

  constructor(
    private worldSize: Vector2,
    private chipLibrary: ChipLibrary,
    private canvas: JQuery<HTMLElement>
  ) {
    this.interactionState = createEmptyInteractionState();

    this.camera = new Camera(
      this.canvas,
      this.worldSize,
      this.dppr,
      2
    );

    this.renderer = new Renderer(
      this.camera,
      this.canvas
    )

    this.chip = new WorkingChip(
      worldSize,
      chipLibrary
    )

    this.cursorHandler = new CursorHandler(
      this.interactionState,
      this.canvas
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
      this.camera,
      this.canvas
    );
  }

  public start() {
    this.renderManager.addRenderable(new GridRenderable(
      crypto.randomUUID(),
      this.chip.worldSize
    ));
  }

  public execute(cmd: Command): SuccessState {
    console.log(`executing: ${cmd.type}`);

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
          this.saveCurrentChip(cmd.ui);
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
    console.log('adding ghost element');

    const def = getGenericChipDef(this.chipLibrary, details);
    
    let iconPath: string | undefined;
    
    // figure out the number of inputs and outputs
    let inputs: number;
    let outputs: number;
    let name: string;
    if (def) { // if we are looking at a chip
      inputs = def.inputs;
      outputs = def.outputs;
      name = def.name
      iconPath = def.icon;
    }
    else {
      inputs = details.type === NodeType.INPUT ? 0 : 1;
      outputs = details.type === NodeType.INPUT ? 1 : 0;
      name = details.type === NodeType.INPUT ? 'Input' : 'Output'
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
        name,
        validPosition,
        iconPath
      )
    }

    console.log(this.interactionState);
  }

  private saveCurrentChip(ui: EditorUI) {
    const issue = this.chip.validate();
    
    if (issue) {
      const errorText = `Couldn't save chip: ${issue}`;
      throw new Error(errorText);
    };

    const isStatic = this.chip.isStatic();

    if (!isStatic) {
      throw new Error('Currently only saving static chips has been implemented');
    }

    const equivalent = this.chipLibrary.findEquivalentStaticPrimitive(
      this.chip.getNetlist().copy()
    );

    // if there is a matching primitive, just add it to the sidebar
    if (equivalent) {
      const def = this.chipLibrary.get(equivalent);

      ui.saveChip(def);
    }
    // otherwise, save the netlist
    else {
      const inputIdToName = this.chip.inputIdsToName();
      const outputIdToName = this.chip.outputIdsToName();

      ui.addModal({
        title: 'Save Chip',
        body: {
          type: 'netlist-chip-creation',
          inputIdToName,
          outputIdToName,
          onSave: (
            name: string, icon: string,
            inputOrder: string[], outputOrder: string[]
          ) => {
            this.saveStaticNonPrimitive(
              ui, name, icon, inputOrder, outputOrder
            );
          }
        }
      })
    }

    this.reset();
  }

  private createStaticDef(
    name: string, icon: string,
    chip: WorkingChip,
    idxToInputId: Map<number, string>,
    idToOutputIdx: Map<string, number>
  ): ChipDefinition {
    if (chip.inputNum() <= 20) {
      return this.createTruthTableDef(
        name, icon, chip, idxToInputId, idToOutputIdx
      )
    }

    else {
      return this.createNetlistDef(
        name, icon, chip, idxToInputId, idToOutputIdx
      )
    }
  }

  private createNetlistDef (
    name: string, icon: string,
    chip: WorkingChip,
    idxToInputId: Map<number, string>,
    idToOutputIdx: Map<string, number>
  ): ChipDefinition {
    const id = crypto.randomUUID();

    return {
      id, name, icon,
      inputs: chip.inputNum(),
      outputs: chip.outputNum(),
      behaviourSpec: {
        kind: 'netlist',
        serialized: chip.getSerializedNetlist(),
        idxToInputId,
        idToOutputIdx
      }
    }
  }

  private createTruthTableDef(
    name: string, icon: string,
    chip: WorkingChip,
    idxToInputId: Map<number, string>,
    idToOutputIdx: Map<string, number>
  ): ChipDefinition {
    console.log('creating truth table');

    const id = crypto.randomUUID();

    const truthTable = TruthtableBehaviour.buildTruthtable(
      chip.getNetlist(), idxToInputId, idToOutputIdx
    );

    return {
      id, name, icon,
      inputs: chip.inputNum(),
      outputs: chip.outputNum(),
      behaviourSpec: {
        kind: 'truthtable',
        table: truthTable,
        inputs: chip.inputNum(),
        outputs: chip.outputNum()
      }
    }
  }

  private saveStaticNonPrimitive(
    ui: EditorUI, name: string, icon: string,
    inputOrder: string[], outputOrder: string[]
  ) {
    // create maps between idx and ids
    const idxToInputId = new Map<number, string>(
      inputOrder.map((value, index) => [index, value])
    );
    const idToOutputIdx = new Map<string, number>(
      outputOrder.map((value, index) => [value, index])
    );

    // create chip definition
    const def = this.createStaticDef(
      name, icon, this.chip, idxToInputId, idToOutputIdx
    );

    // register chip
    this.chipLibrary.register(def);

    ui.closeModal();
    ui.saveChip(def);
  }

  private reset() {
    this.camera.reset();
    this.renderManager.reset(this.worldSize);
    this.chip.getSerializedNetlist();
    emptyInteractionState(this.interactionState);
    this.actionDoer.reset();
  }
}