export class Event {
  constructor(public name: String, public source: String, public target: String) {}
}

export class EventLog implements IterableIterator<Event> {

  private pointer = 0;

  constructor(public events: Event[]) {}

  public next(): IteratorResult<Event> {
    if (this.pointer < this.events.length) {
      return {
        done: false,
        value: this.events[this.pointer++]
      }
    } else {
      return {
        done: true,
        value: null
      }
    }
  }

  [Symbol.iterator](): IterableIterator<Event> {
    return this;
  }

}