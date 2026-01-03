import { Vector2 } from "../utils/Vector2";

export type Handler<Payload = any> = (payload: Payload) => void;

export type EventPayloads = {
  pan: { delta: Vector2 };
  "begin-pan": void;
  "end-pan": void;
  zoom: { factor: number, screenPos: Vector2 };
  resize: void;
  "space-down": void;
  "space-up": void;
  "mouse-moved-into-element": { elementId: string };
  "mouse-moved-off-element": void;
  "mouse-changed-cell": { from: Vector2, to: Vector2 };
  "render-buffer-updated": void;
};

export type EventTypes = keyof EventPayloads;

export type EventHandlerMap = {
  [K in EventTypes]?: Handler<EventPayloads[K]>;
};