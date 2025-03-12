import { InitiatedTransition, MainProcess, Transition } from "./Encoding";
import { IFromEncoding } from "./IFromEncoding";

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
    public subModels: Map<string, SubProcessEncoding> | null = null
  ) {}

  static fromEncoding(encoding: MainProcess): TriggerEncoding {
    const processID = encoding.id ?? "";
    const tasks = TriggerEncoding.IDsFromTransitions(Array.from(encoding.transitions.values()));
    const participants = new Map(
      [...encoding.participants.values()].map(({ modelID, id }) => [modelID, Number(id)])
    );
    const subModels = encoding.subProcesses.size > 0
      ? new Map(
          [...encoding.subProcesses.values()].map(subProcess => [
            subProcess.modelID,
            new SubProcessEncoding(
              subProcess.id,
              TriggerEncoding.IDsFromTransitions(Array.from(subProcess.transitions.values()))
            )
          ])
        )
      : null;

    return new TriggerEncoding(processID, tasks, participants, subModels);
  }

  private static IDsFromTransitions(transitions: Transition[]): Map<string, number> {
    return new Map(
      transitions
        .filter(transition => transition instanceof InitiatedTransition)
        .map(transition => [(transition as InitiatedTransition).modelID, Number((transition as InitiatedTransition).taskID)])
    );
  }

  static toJSON(encoding: TriggerEncoding) {
    return {
      processID: encoding.processID,
      tasks: Object.fromEntries(encoding.tasks),
      participants: Object.fromEntries(encoding.participants),
      subModels: encoding.subModels
        ? Object.fromEntries(
            [...encoding.subModels].map(([key, subProcess]) => [
              key,
              SubProcessEncoding.toJSON(subProcess)
            ])
          )
        : undefined,
    };
  }

  static fromJSON(object: {
    processID: number;
    tasks: { [k: string]: number };
    participants: { [k: string]: number };
    subModels?: { [k: string]: { id: number; tasks: { [k: string]: number } } };
  }): TriggerEncoding {
    return new TriggerEncoding(
      object.processID,
      new Map(Object.entries(object.tasks)),
      new Map(Object.entries(object.participants)),
      object.subModels
        ? new Map(
            Object.entries(object.subModels).map(([key, subProcess]) => [
              key,
              SubProcessEncoding.fromJSON(subProcess)
            ])
          )
        : null
    );
  }
}

class SubProcessEncoding {
  constructor(
    public id: number,
    public tasks: Map<string, number>
  ) {}

  static toJSON(subProcess: SubProcessEncoding) {
    return {
      id: subProcess.id,
      tasks: Object.fromEntries(subProcess.tasks),
    };
  }

  static fromJSON(object: { id: number; tasks: { [k: string]: number } }): SubProcessEncoding {
    return new SubProcessEncoding(object.id, new Map(Object.entries(object.tasks)));
  }
}