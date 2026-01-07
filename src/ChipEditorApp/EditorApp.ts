import { Camera } from "./rendering/Camera";
import { RenderManager } from "./rendering/RenderManager";
import { InputManager } from "./inputs/InputManager";
import { Vector2 } from "../utils/Vector2";
import { WebpageUtils } from "../utils/WebpageUtils";

export class EditorApp {
  private camera: Camera;
  public renderer: RenderManager; // MAKE PRIVATE LATER
  private input: InputManager;

  private dppr: number = WebpageUtils.calculateDevicePixelRatio();

  constructor(worldSize: Vector2) {
    this.camera = new Camera(worldSize, this.dppr);

    this.renderer = new RenderManager(
      worldSize,
      this.camera
    );

    this.input = new InputManager(
      this.camera
    );
  }

  // start() {
  //   this.input.start();
  //   this.renderer.start();
  // }
}