import assert from "assert";
import seed from 'seed-random';
import { TriggerEncoding } from "../Generator/Encodings/TriggerEncoding";

export class Event {
  public target: string|null = null;
  public dataChange: InstanceDataChange[]|null = null;

  constructor(
    public name: string, 
    public source: string, 
    _target?: string,
    _dataChange?: InstanceDataChange[]) {
    
    if (_dataChange)
      this.dataChange = _dataChange;
    if (_target)
      this.target = _target;
  }
}

export class InstanceDataChange {
  constructor(public variable: string, public val: boolean) { }
}

export class EventLog implements IterableIterator<Trace>{
  constructor(public traces: Trace[]) {}
  private pointer = 0;

  public next(): IteratorResult<Trace> {
    if (this.pointer < this.traces.length) {
      return {
        done: false,
        value: this.traces[this.pointer++]
      }
    } else {
      return {
        done: true,
        value: null
      }
    }
  }

  [Symbol.iterator](): IterableIterator<Trace> {
    return this;
  }

  /**
   * Generate @to_generate number of non-conforming traces based on @conforming
   * prevents and reports accidentaly generated conforming traces
   * 
   * @param log Conforming EventLog to serve as basis
   * @param process ProcessEncoding corresponding to @conforming
   * @param to_generate Number of Traces to generate
   * @param _seed Random seed
   * @param passes Number of modifications to perform for each trace
   * @returns EventLog with non conforming traces
   */
  static genNonConformingLog(
    log: EventLog, 
    process: TriggerEncoding, 
    to_generate = 10,
    _seed = "b",
    passes = 1,
  ) {

    const randomParticipantName = () => {
      return [...process.participants.keys()][seedRandMax(process.participants.size)];
    }

    const randomEventName = () => {
      return [...process.tasks.keys()][seedRandMax(process.tasks.size)];
    }

    const seedRand = seed(_seed);
    const seedRandMax = (max: number) => Math.floor(seedRand() * max);

    const generatedLog = new EventLog(new Array<Trace>());

    let conformingNr = 0;
    for (let i = 0; i < to_generate; i++) {

      // Pick a random conforming trace as basis
      // (!) make a deep copy 
      let genEvents = [...log.traces[seedRandMax(log.traces.length)].events];
      assert(genEvents.length > 0, "empty trace");

      for (let j = 0; j < passes; j++) {

        const randOperation = seedRandMax(5);    

        switch (randOperation) {
          case 0: { 
            // add an event
            genEvents.splice(
              seedRandMax(genEvents.length), 
              0, 
              new Event(randomEventName(), randomParticipantName(), randomParticipantName())
            );
            break;
          }
          case 1: {
            // move an event
            genEvents.splice(
              seedRandMax(genEvents.length), 
              0, 
              genEvents.pop()!
            );
            break;
          }
          case 2: {
            // duplicate an event
            genEvents.splice(
              seedRandMax(genEvents.length), 
              0, 
              genEvents[seedRandMax(genEvents.length)]
            );
            break;
          }
          case 3: {
            // remove an event
            const remove = randomEventName();
            genEvents = genEvents.filter(event => event.name !== remove);
            break;
          }
          case 4: {
            // switch the order of two events
            if (genEvents.length <= 1) {
              break;
            }
            const index = seedRandMax(genEvents.length-1) + 1;
            const tmp = genEvents[index-1];
            genEvents[index-1] = genEvents[index];
            genEvents[index] = tmp;
            break;
          }
        }
      }

      if (log.traces.some(t => JSON.stringify(t.events) === JSON.stringify(genEvents))) {
        conformingNr++;
      } else {
        generatedLog.traces.push(new Trace(genEvents));
      }
    }

    console.log(
      "Generated", to_generate - conformingNr, "traces; generated", 
      conformingNr, "conforming traces, which were skipped."
    )

    return generatedLog;
  }
}

export class Trace implements IterableIterator<Event> {

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