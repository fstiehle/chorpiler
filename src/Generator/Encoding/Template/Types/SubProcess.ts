import type * as Encoding from "../../Encoding.js";
import { Options } from "./Options.js";
import { State } from "./State.js";

/**
 * Represents a sub-process in the template encoding.
 * Used for rendering sub-process enactment functions.
 *
 * Template expressions used from subprocesses.handlebars.sol:
 * - modelID: sub-process model identifier (function name)
 * - id: numeric identifier for the sub-process
 * - states: array of states within this sub-process
 *
 * Note: States within SubProcess access parent context properties (options, isInstanced,
 * hasSubProcesses, id, modelID) via ../ in nested partials (tokenstate, etc.).
 * The SubProcess context is available to child states, and they can reach up to Contract
 * properties as needed.
 */
export class SubProcess {
  constructor(
    public modelID: string,
    public id: string,
    public states: State[],
    public options: Options,
    public hasDataTasks: boolean,
    public isChannel: boolean,
    public isInstanced: boolean
  ) {
  }

  hasSubProcesses = true

  /**
   * Creates a SubProcess instance from an Encoding.SubProcess.
   */
  static fromEncoding(
    subProcess: Encoding.SubProcess,
    isInstanced: boolean,
    isChannel: boolean,
    options: Options,
    hasDataTasks: boolean,
    caseVariables: Map<string, Encoding.CaseVariable>
  ): SubProcess {
    // Convert states for this sub-process
    const states = Array.from(subProcess.states.entries()).map(([consume, transitions]) => {
      return State.fromEncoding(
        consume,
        transitions,
        new Set(), // Sub-processes don't separate case variable tasks
        isInstanced,
        options,
        true,
        subProcess.id.toString(),
        subProcess.modelID,
        caseVariables
      );
    });

    return new SubProcess(
      subProcess.modelID,
      subProcess.id.toString(),
      states,
      options,
      hasDataTasks,
      isInstanced,
      isChannel,
    );
  }
}