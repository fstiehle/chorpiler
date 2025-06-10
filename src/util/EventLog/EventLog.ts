import assert from "assert";
import seed from 'seed-random';
import { TriggerEncoding } from "../../Generator/Encoding/TriggerEncoding";
import { Trace } from "./Trace";

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

    const randomEventID = () => {
      return [...process.tasks.keys()][seedRandMax(process.tasks.size)];
    }
    const getEventNameForID = (eventID: string) => {
      for (const trace of log.traces) {
      for (const event of trace.events) {
        if (event.id === eventID) {
        return event.name;
        }
      }
      }
      return eventID; // fallback if not found
    };

    const seedRand = seed(_seed);
    const seedRandMax = (max: number) => Math.floor(seedRand() * max);

    const generatedLog = new EventLog(new Array<Trace>());

    let conformingNr = 0;
    for (let i = 0; i < to_generate; i++) {

      // Pick a random conforming trace as basis
      // (!) make a deep copy 
      let genEvents = [...log.traces[seedRandMax(log.traces.length)].events];
      assert(genEvents.length >= 1, "empty trace");

      for (let j = 0; j < passes; j++) {

        const randOperation = seedRandMax(5);

        // Only operate on events that are not "Instance Data Change"
        const validEventIndexes = genEvents
          .map((e, idx) => e.name !== "Instance Data Change" ? idx : -1)
          .filter(idx => idx !== -1);

        switch (randOperation) {
          case 0: { 
            // add an event
            const id = randomEventID();
            genEvents.splice(
              seedRandMax(genEvents.length), 
              0, 
              new Event(getEventNameForID(id), id, randomParticipantName(), randomParticipantName())
            );
            break;
          }
          case 1: {
            // move an event
            if (validEventIndexes.length > 0) {
              const moveIdx = validEventIndexes[seedRandMax(validEventIndexes.length)];
              const [event] = genEvents.splice(moveIdx, 1);
              genEvents.splice(seedRandMax(genEvents.length + 1), 0, event);
            }
            break;
          }
          case 2: {
            // duplicate an event
            if (validEventIndexes.length > 0) {
              const dupIdx = validEventIndexes[seedRandMax(validEventIndexes.length)];
              genEvents.splice(
                seedRandMax(genEvents.length + 1), 
                0, 
                genEvents[dupIdx]
              );
            }
            break;
          }
          case 3: {
            // remove an event
            if (validEventIndexes.length > 0) {
              const remIdx = validEventIndexes[seedRandMax(validEventIndexes.length)];
              genEvents.splice(remIdx, 1);
            }
            break;
          }
          case 4: {
            // switch the order of two events
            if (validEventIndexes.length > 1) {
              const idx1 = validEventIndexes[seedRandMax(validEventIndexes.length)];
              let idx2 = idx1;
              while (idx2 === idx1) {
                idx2 = validEventIndexes[seedRandMax(validEventIndexes.length)];
              }
              // Swap only if both are valid and not the same
              const tmp = genEvents[idx1];
              genEvents[idx1] = genEvents[idx2];
              genEvents[idx2] = tmp;
            }
            break;
          }
        }
      }

      const isConforming = log.traces.some(t =>
        // Only compare non-"Instance Data Change" events
        t.events.filter(e => e.name !== "Instance Data Change").length === genEvents.filter(e => e.name !== "Instance Data Change").length &&
        t.events.filter(e => e.name !== "Instance Data Change").every((e, idx) =>
          e.id === genEvents.filter(ev => ev.name !== "Instance Data Change")[idx].id &&
          e.source === genEvents.filter(ev => ev.name !== "Instance Data Change")[idx].source
        )
      );
      if (isConforming) {
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

export class Event {
  public target: string|null = null;
  public dataChange: InstanceDataChange[]|null = null;

  constructor(
    public name: string,
    public id: string,
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
  constructor(public variable: string, public val: boolean|number) { }
}