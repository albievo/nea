import { Vector2 } from "../../utils/Vector2";

export type Handler<Payload = any> = (payload: Payload) => void;

export type EventPayloads = {
  resize: void;
  "space-down": void;
  "space-up": void;
  "mouse-changed-cell": { from: Vector2, to: Vector2 };
  "mouse-down": { worldPos: Vector2 };
  "mouse-up": { worldPos: Vector2 };
  "mouse-move": { worldPos: Vector2 };
  "wheel": { delta: Vector2, worldPos: Vector2 };
  'ctrl-z': void;
  'ctrl-y': void;
};

export type EventTypes = keyof EventPayloads;

export type EventHandlerMap = {
  [K in EventTypes]?: Handler<EventPayloads[K]>;
};