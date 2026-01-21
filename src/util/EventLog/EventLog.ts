import assert from "assert";
import seed from "seed-random";
import { TriggerEncoding } from "../../Generator/Encoding/TriggerEncoding.js";
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
}

export class Event {
  public target: string | null = null;
  public dataChange: InstanceDataChange[] | null = null;

  constructor(
    public name: string,
    public id: string,
    public source: string,
    _target?: string,
    _dataChange?: InstanceDataChange[],
  ) {
    if (_dataChange) this.dataChange = _dataChange;
    if (_target) this.target = _target;
  }
}

export class InstanceDataChange {
  constructor(
    public variable: string,
    public val: boolean | number,
  ) {}
}
