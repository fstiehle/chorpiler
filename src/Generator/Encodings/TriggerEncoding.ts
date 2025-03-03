import { Process, Transitions } from "../Encoding";
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
    public processID: string,
    public tasks: Map<string, number> = new Map(),
    public participants: Map<string, number> = new Map(),
    public subModels: Map<string, SubProcessEncoding> | null = null
  ) {}
  
  static fromEncoding(encoding: Process): TriggerEncoding {
    const processID = encoding.id ?? "";
    const tasks = TriggerEncoding.IDsFromTransitions(encoding.transitions);
    const participants = new Map(
      [...encoding.participants.values()].map(({ modelID, id }) => [modelID, Number(id)])
    );
    const subModels = new Map(
      [...encoding.subProcesses.values()].map(subProcess => [
        subProcess.modelID,
        new SubProcessEncoding(
          subProcess.id,
          TriggerEncoding.IDsFromTransitions(subProcess.transitions)
        )
      ])
    );
    
    return new TriggerEncoding(processID, tasks, participants, subModels);
  }

  private static IDsFromTransitions(transitions: Transitions): Map<string, number> {
    return new Map(
      transitions.manual.if.map(transition => [transition.modelID, Number(transition.id)])
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
    processID: string;
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