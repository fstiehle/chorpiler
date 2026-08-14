import { Options } from "./Options.js";
import { Call } from "./Call.js";
import { CaseVariable } from "./CaseVariable.js";
import { DataTask } from "./DataTask.js";
import { State } from "./State.js";
import { SubProcess } from "./SubProcess.js";

/**
 * Main Contract class representing the complete template data structure.
 * This class aggregates all data needed to render Contract.handlebars.sol
 * and its partials.
 *
 * Template expressions used from Contract.handlebars.sol:
 * - options: compile options (debug, events)
 * - modelID: contract name/identifier
 * - numberOfParticipants: number of participant roles
 * - hasSubProcesses: whether contract has sub-processes
 * - hasCalls: whether contract calls other choreographies
 * - numberOfCalls: number of called choreographies
 * - numberOfProcesses: total number of processes (main + subs)
 * - callList: array of called contract interfaces
 * - caseVariables: array of case variables
 * dataTasks: array of tasks that set case variables
 * - states: array of states in the main process
 * - subProcesses: array of sub-processes
 */
export class Contract {
  constructor(
    public options: Options,
    public modelID: string,
    public numberOfParticipants: string,
    public hasSubProcesses: boolean,
    public hasCalls: boolean,
    public numberOfCalls: string,
    public numberOfProcesses: string,
    public callList: Call[],
    public caseVariables: CaseVariable[],
    public dataTasks: DataTask[],
    public states: State[],
    public subProcesses: SubProcess[],
    public isInstanced: boolean,
    public isChannel: boolean,
    public id: string,
  ) {}

  /**
   * Helper getter to determine if the contract has case variables.
   * Useful for conditional rendering in templates.
   */
  get hasCaseVariables(): boolean {
    return this.caseVariables.length > 0;
  }

  /**
   * Helper getter to determine if the contract has data tasks.
   * Useful for conditional rendering in templates.
   */
  get hasDataTasks(): boolean {
    return this.dataTasks.length > 0;
  }

  /**
   * Helper getter to determine if the contract has states.
   * Useful for conditional rendering in templates.
   */
  get hasStates(): boolean {
    return this.states.length > 0;
  }
}