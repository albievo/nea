import { EventTypes, EventPayloads, EventHandlerMap, Handler } from "./eventTypes";

class Events {
  // maps event types to a list of functions to trigger when that event is emitted
  private listeners: {
    [K in EventTypes]?: Handler<EventPayloads[K]>[];
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
      handler(arg);
    }
  }

  /**
   * Attach a listener for the passed type
   */
  on<K extends EventTypes>(
    type: K,
    handler: Handler<EventPayloads[K]>
  ): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type]!.push(handler);
  }

  /**
   * Removes the passed handler
   */
  public off<K extends EventTypes>(
    type: K,
    handler: Handler<EventPayloads[K]>
  ): void {
    const handlers = this.listeners[type];
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
}

const events = new Events();

export default events;