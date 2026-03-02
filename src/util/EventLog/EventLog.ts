import { Trace } from "./Trace.js";

export class EventLog implements IterableIterator<Trace> {
  constructor(public traces: Trace[]) {}
  private pointer = 0;

  public next(): IteratorResult<Trace> {
    if (this.pointer < this.traces.length) {
      return {
        done: false,
        value: this.traces[this.pointer++],
      };
    } else {
      return {
        done: true,
        value: null,
      };
    }
  }

  [Symbol.iterator](): IterableIterator<Trace> {
    return this;
  }

  getEncoding() {
    return {
      traces: this.traces.map((e, i) => {
        (e as any)["id"] = i;
        return e;
      }),
    };
  }
}

export class Event {
  public targets: string[] | null = null;
  public dataChange: InstanceDataChange[] | null = null;

  constructor(
    public name: string,
    public id: string,
    public source: string,
    _targets?: string[],
    _dataChange?: InstanceDataChange[],
  ) {
    if (_dataChange) this.dataChange = _dataChange;
    if (_targets) this.targets = _targets;
  }
}

export class InstanceDataChange {
  constructor(
    public variable: string,
    public val: boolean | number,
  ) {}
}
