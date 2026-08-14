import { Event } from "./EventLog.js";

export class Trace implements Iterable<Event> {
  constructor(public events: Event[]) {}

  [Symbol.iterator](): Iterator<Event> {
    let pointer = 0;
    const events = this.events;

    return {
      next(): IteratorResult<Event> {
        if (pointer < events.length) {
          return {
            done: false,
            value: events[pointer++],
          };
        } else {
          return {
            done: true,
            value: null,
          };
        }
      }
    };
  }
}
