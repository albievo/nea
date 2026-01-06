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
  "render-required": void;
  "temp-wire-path-updated": { endCell: Vector2 };
  "temp-wire-released": { fromElement: string, fromOutput: number };
  "grid-element-moved": { id: string }
};

export type EventTypes = keyof EventPayloads;

export const eventTypes = [
  "pan",
  "begin-pan",
  "end-pan",
  "zoom",
  "resize",
  "space-down",
  "space-up",
  "mouse-moved-into-element",
  "mouse-moved-off-element",
  "mouse-changed-cell",
  "render-required",
  "temp-wire-path-updated",
  "temp-wire-released",
] as const satisfies readonly EventTypes[];

export type EventHandlerMap = {
  [K in EventTypes]?: Handler<EventPayloads[K]>;
};