import { Camera } from "../rendering/Camera";
import { RenderManager } from "../rendering/RenderManager";
import { InputManager } from "../inputs/InputManager";
import { Vector2 } from "../../utils/Vector2";
import { WebpageUtils } from "../../utils/WebpageUtils";
import { Renderer } from "../rendering/Renderer";
import { WorkingChip } from "../model/WorkingChip";
import { InteractionController, InteractionState } from "../controller/InteractionController";
import { ActionDoer } from "../actions/ActionDoer";
import { ActionContext } from "../actions/Action";
import { GridRenderable } from "../rendering/renderables/GridRenderable";
import { Command } from "./Command";
import { CreateInputElementAction } from "../actions/action-types/CreateElementAction";

export class EditorApp {
  private camera: Camera;
  private renderer
  private renderManager: RenderManager;
  private input: InputManager;
  private chip: WorkingChip;
  private interactionState: InteractionState = { };
  private actionDoer: ActionDoer;
  private controller: InteractionController;

  private dppr: number = WebpageUtils.calculateDevicePixelRatio();

  constructor(worldSize: Vector2) {
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
      this.camera
    );

    this.controller = new InteractionController(
      this.renderManager,
      this.actionDoer,
      this.chip,
      this.interactionState,
      this.camera
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
      case 'add-input-element': this.addInputElement(cmd.pos, cmd.id);
    }
  }

  private addInputElement(pos: Vector2, id?: string) {
    this.actionDoer.do(new CreateInputElementAction(
      id || crypto.randomUUID(), pos
    ));
  }
}

// class EditorApp {
//   camera: Camera;
//   chip: WorkingChip;
//   undo: UndoManager;
//   renderer: RenderManager;
//   input: InputManager;
//   controller: EditorController;

//   constructor(canvas: HTMLCanvasElement) {
//     this.camera = new Camera(canvas);

//     this.chip = new WorkingChip();

//     this.undo = new UndoManager();

//     this.renderer = new RenderManager(
//       canvas,
//       this.camera,
//       this.chip
//     );

//     this.input = new InputManager(
//       canvas,
//       this.camera
//     );

//     this.controller = new EditorController(
//       this.chip,
//       this.undo,
//       this.renderer,
//       this.input
//     );
//   }

//   start() {
//     this.input.start();
//     this.renderer.start();
//   }
// }