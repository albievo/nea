import { EventTypes, EventPayloads, EventHandlerMap, Handler } from "./eventTypes";

class Events {
  // maps event types to a list of functions to trigger when that event is emitted
  private listeners: {
    [K in EventTypes]?: HandlerWithId<K>[];
  } = {};

  /**
   * Tell the event handler that this event has occured
   * 
   * Payload is nothing or the relevant payload type depending on what it says in the EventPayloads object
   * */
  public emit<K extends EventTypes>(
    type: K,
    ...payload: EventPayloads[K] extends void ? [] : [EventPayloads[K]] 
  ): void {
    // get the current handlers for this event and return if there are none
    const handlers = this.listeners[type];
    if (!handlers) return;

    // get the payload
    const arg = payload[0] as EventPayloads[K];

    // run each handler w/ the payload
    for (const handler of handlers) {
      handler.handler(arg);
    }
  }

  /**
   * Attach a listener for the passed type
   */
  on<K extends EventTypes>(
    type: K,
    handler: Handler<EventPayloads[K]>,
    id?: string,
  ): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type]!.push({
      handler,
      id
    });
  }

  /**
   * removes the handler with the passed id
   */
  public off<K extends EventTypes>(
    type: K,
    id: string
  ): void {
    const handlers = this.listeners[type];
    if (!handlers) return;

    const indices = this.findIndicesOfHandlersWithId(handlers, id);
    indices.forEach(index => {
      handlers.splice(index, 1);
    });
  }

  private findIndicesOfHandlersWithId<K extends EventTypes>(
    handlers: HandlerWithId<K>[],
    id: string
  ): number[] {
    const indices: number[] = [];

    for (let handlerIdx = 0; handlerIdx < handlers.length; handlerIdx++) {
      if (handlers[handlerIdx].id === id) {
        indices.push(handlerIdx);
      }
    }

    return indices;
  }
}

interface HandlerWithId<K extends EventTypes> {
  handler: Handler<EventPayloads[K]>,
  id?: string
}

const events = new Events();

export default events;