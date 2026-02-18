import { InitiatedTransition, MainProcess, Transition } from "./Encoding.js";
import { IFromEncoding } from "./IFromEncoding.js";

/**
 * Represents the encoding of the process with information needed for
 * interacting with the process
 *
 * - `tasks`: Maps task modelIDs from the BPMN model (string) to task objects with id, initiator, and processID.
 * - `participants`: Maps participant IDs from the BPMN model (string) to implementation IDs (number).
 * - `subModels`: Maps subprocess processIDs (number) to subprocess objects with modelID and participants.
 */
export class TriggerEncoding implements IFromEncoding {
  constructor(
    public processID: number,
    public isCalled: boolean = false,
    public isInstanced: boolean = false,
    public tasks: Map<string, Task> = new Map(),
    public participants: Map<string, number> = new Map(),
    public states: Map<string, number> = new Map(),
    public calls: Map<string, number> = new Map(),
    public subModels: Map<number, SubModel> = new Map(),
  ) {}

  static fromEncoding(encoding: MainProcess): TriggerEncoding {
    const processID = encoding.id ?? 0;

    // Extract tasks with id, initiator, and processID from main process and all subprocesses
    const tasks = new Map<string, Task>();

    // Add tasks from main process
    TriggerEncoding.extractTasks(
      Array.from(encoding.transitions.values()),
      processID,
      tasks,
    );

    // Add tasks from all subprocesses
    encoding.subProcesses.forEach((subProcess) => {
      TriggerEncoding.extractTasks(
        Array.from(subProcess.transitions.values()),
        subProcess.id,
        tasks,
      );
    });

    const participants = new Map(
      [...encoding.participants.values()].map(({ modelID, id }) => [
        modelID,
        Number(id),
      ]),
    );

    const states = new Map(
      [...encoding.states.entries()].flatMap(([key, value]) =>
        value.map((e) => [e.id, key]),
      ),
    );

    // Extract subModels with processID as key, including their states
    const subModels = new Map(
      Array.from(encoding.subProcesses.values()).map((subProcess) => {
        const subProcessStates = new Map(
          [...subProcess.states.entries()].flatMap(([key, value]) =>
            value.map((e) => [e.id, key]),
          ),
        );

        return [
          subProcess.id,
          new SubModel(
            subProcess.id,
            subProcess.modelID,
            new Map(
              [...subProcess.participants.values()].map(({ modelID, id }) => [
                modelID,
                Number(id),
              ]),
            ),
            subProcessStates,
          ),
        ];
      }),
    );

    return new TriggerEncoding(
      processID,
      encoding.isCalled,
      encoding.isInstanced,
      tasks,
      participants,
      states,
      new Map(
        Array.from(encoding.callList.entries()).map(([key, call]) => [
          key,
          call.id,
        ]),
      ),
      subModels,
    );
  }

  private static extractTasks(
    transitions: Transition[],
    processID: number,
    taskMap: Map<string, Task>,
  ): void {
    transitions
      .filter((transition) => transition instanceof InitiatedTransition)
      .forEach((transition) => {
        const initiated = transition as InitiatedTransition;
        taskMap.set(
          initiated.modelID,
          new Task(initiated.taskID, initiated.initiatorID, processID),
        );
      });
  }

  static toJSON(encoding: TriggerEncoding) {
    return {
      processID: encoding.processID,
      isCalled: encoding.isCalled,
      isInstanced: encoding.isInstanced,
      tasks: Object.fromEntries(
        Array.from(encoding.tasks.entries()).map(([modelID, task]) => [
          modelID,
          {
            id: task.encoding,
            initiator: task.initiator,
            processID: task.processID,
          },
        ]),
      ),
      participants: Object.fromEntries(encoding.participants),
      states: Object.fromEntries(encoding.states),
      calls: Object.fromEntries(encoding.calls),
      subModels: Object.fromEntries(
        Array.from(encoding.subModels.entries()).map(
          ([processID, subModel]) => [
            processID,
            {
              modelID: subModel.modelID,
              processID: subModel.processID,
              participants: Object.fromEntries(subModel.participants),
              states: Object.fromEntries(subModel.states),
            },
          ],
        ),
      ),
    };
  }

  static fromJSON(object: {
    processID: number;
    isCalled?: boolean;
    isInstanced?: boolean;
    tasks: {
      [modelID: string]: { id: number; initiator: number; processID: number };
    };
    participants: { [k: string]: number };
    calls?: { [k: string]: number };
    states?: { [k: string]: number };
    subModels: {
      [processID: string]: {
        modelID: string;
        processID: number;
        participants: { [k: string]: number };
        states: { [k: string]: number };
      };
    };
  }): TriggerEncoding {
    return new TriggerEncoding(
      object.processID,
      object.isCalled ?? false,
      object.isInstanced ?? false,
      new Map(
        Object.entries(object.tasks).map(([modelID, task]) => [
          modelID,
          new Task(task.id, task.initiator, task.processID),
        ]),
      ),
      new Map(Object.entries(object.participants)),
      object.states
        ? new Map(
            Object.entries(object.states).map(([key, value]) => [key, value]),
          )
        : new Map(),
      object.calls ? new Map(Object.entries(object.calls)) : new Map(),
      new Map(
        Object.entries(object.subModels).map(([processID, subModel]) => [
          Number(processID),
          new SubModel(
            subModel.processID,
            subModel.modelID,
            new Map(Object.entries(subModel.participants)),
            new Map(
              Object.entries(subModel.states).map(([key, value]) => [
                key,
                Number(value),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

class Task {
  constructor(
    public encoding: number,
    public initiator: number,
    public processID: number,
  ) {}
}

class SubModel {
  constructor(
    public processID: number,
    public modelID: string,
    public participants: Map<string, number>,
    public states: Map<string, number> = new Map(),
  ) {}
}
