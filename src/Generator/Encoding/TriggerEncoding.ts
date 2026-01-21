import { InitiatedTransition, MainProcess, Transition } from "./Encoding.js";
import { IFromEncoding } from "./IFromEncoding.js";

/**
 * Represents the encoding of the process with information needed for
 * interacting with the process
 *
 * - `tasks`: Maps task IDs from the BPMN model (string) to their corresponding implementation IDs (number).
 * - `participants`: Maps participant IDs from the BPMN model (string) to implementation IDs (number).
 * - `subModels`: Stores subprocess encodings mapped by their BPMN model IDs.
 */
export class TriggerEncoding implements IFromEncoding {
  constructor(
    public processID: number,
    public tasks: Map<string, number> = new Map(),
    public participants: Map<string, number> = new Map(),
    public states: Map<number, string[]> = new Map(),
    public subModels: Map<string, SubProcessEncoding> | null = null,
  ) {}

  static fromEncoding(encoding: MainProcess): TriggerEncoding {
    const processID = encoding.id ?? "";
    const tasks = TriggerEncoding.IDsFromTransitions(
      Array.from(encoding.transitions.values()),
    );
    const participants = new Map(
      [...encoding.participants.values()].map(({ modelID, id }) => [
        modelID,
        Number(id),
      ]),
    );
    const states = new Map(
      [...encoding.states.entries()]
        .filter((entry) => entry[1] instanceof Array)
        .map((entry) => [
          entry[0],
          entry[1]
            .filter((e) => e instanceof InitiatedTransition)
            .map((e) => e.modelID),
        ]),
    );
    const subModels =
      encoding.subProcesses.size > 0
        ? new Map(
            [...encoding.subProcesses.values()].map((subProcess) => [
              subProcess.modelID,
              new SubProcessEncoding(
                subProcess.id,
                TriggerEncoding.IDsFromTransitions(
                  Array.from(subProcess.transitions.values()),
                ),
              ),
            ]),
          )
        : null;

    return new TriggerEncoding(
      processID,
      tasks,
      participants,
      states,
      subModels,
    );
  }

  private static IDsFromTransitions(
    transitions: Transition[],
  ): Map<string, number> {
    return new Map(
      transitions
        .filter((transition) => transition instanceof InitiatedTransition)
        .map((transition) => [
          (transition as InitiatedTransition).modelID,
          Number((transition as InitiatedTransition).taskID),
        ]),
    );
  }

  static toJSON(encoding: TriggerEncoding) {
    return {
      processID: encoding.processID,
      tasks: Object.fromEntries(encoding.tasks),
      participants: Object.fromEntries(encoding.participants),
      states: Object.fromEntries(encoding.states),
      subModels: encoding.subModels
        ? Object.fromEntries(
            [...encoding.subModels].map(([key, subProcess]) => [
              key,
              SubProcessEncoding.toJSON(subProcess),
            ]),
          )
        : undefined,
    };
  }

  static fromJSON(object: {
    processID: number;
    tasks: { [k: string]: number };
    participants: { [k: string]: number };
    states?: { [k: string]: string[] };
    subModels?: { [k: string]: { id: number; tasks: { [k: string]: number } } };
  }): TriggerEncoding {
    return new TriggerEncoding(
      object.processID,
      new Map(Object.entries(object.tasks)),
      new Map(Object.entries(object.participants)),
      object.states
        ? new Map(
            Object.entries(object.states).map(([key, value]) => [
              Number(key),
              value,
            ]),
          )
        : new Map(),
      object.subModels
        ? new Map(
            Object.entries(object.subModels).map(([key, subProcess]) => [
              key,
              SubProcessEncoding.fromJSON(subProcess),
            ]),
          )
        : null,
    );
  }
}

class SubProcessEncoding {
  constructor(
    public id: number,
    public tasks: Map<string, number>,
  ) {}

  static toJSON(subProcess: SubProcessEncoding) {
    return {
      id: subProcess.id,
      tasks: Object.fromEntries(subProcess.tasks),
    };
  }

  static fromJSON(object: {
    id: number;
    tasks: { [k: string]: number };
  }): SubProcessEncoding {
    return new SubProcessEncoding(
      object.id,
      new Map(Object.entries(object.tasks)),
    );
  }
}
