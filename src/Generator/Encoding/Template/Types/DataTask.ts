import * as Encoding from "../../Encoding.js";
import { CallType } from "../../../../Parser/Elements/Call.js";
import { Options } from "./Options.js";

/**
 * Represents a task with case variable in the template encoding.
 * Used for rendering data tasks (functions that set case variables).
 *
 * Template expressions used from datatasks.handlebars.sol:
 * - modelID: task model identifier (function name)
 * - isInstanced: whether the process is instanced
 * - type: Solidity type of the case variable
 * - name: case variable name
 * - consume: token to consume
 * - conditionString: validation conditions (require statements)
 * - produce: token to produce
 *
 * Propagated properties (for nested partials):
 * - options: compile options (for debug logging)
 * - isInstanced: instance support (for variableassign and tokenstate partials)
 * - hasSubProcesses: whether contract has sub-processes (for tokenstate partial)
 * - id: process identifier (for tokenstate partial)
 */
export class DataTask {
  constructor(
    public modelID: string,
    public isInstanced: boolean,
    public type: string,
    public name: string,
    public consume: string,
    public conditionString: string,
    public produce: string,
    public options: Options,
    public hasSubProcesses: boolean,
    public id: string,
    public taskID: number,
    public subProcessCallback: string | null
  ) {}

  /**
   * Creates a DataTask instance from an Encoding.InitiatedTransition.
   */
  static fromEncoding(
    transition: Encoding.InitiatedTransition,
    isInstanced: boolean,
    options: Options,
    hasSubProcesses: boolean,
    id: string,
    subProcessCallback: string | null
  ): DataTask {
    if (!transition.message?.caseVariable) {
      throw new Error("DataTask requires a transition with a caseVariable");
    }

    const caseVar = transition.message.caseVariable;
    const conditionString = buildConditionString(transition, isInstanced);

    return new DataTask(
      transition.modelID,
      isInstanced,
      caseVar.type,
      caseVar.name,
      transition.consume.toString(),
      conditionString,
      transition.produce.toString(),
      options,
      hasSubProcesses,
      id,
      transition.taskID,
      subProcessCallback
    );
  }
}

/**
 * Builds require() condition string for DataTask.
 */
function buildConditionString(
  transition: Encoding.InitiatedTransition,
  isInstanced: boolean
): string {
  const conditions: string[] = [];

  if (transition.inFrom && isSubChoreography(transition.inFrom)) {
    const tokenStateRef = isInstanced
      ? `processData[instanceID].tokenState[${transition.inFrom.id}]`
      : `tokenState[${transition.inFrom.id}]`;
    conditions.push(
      `require(0 == ${tokenStateRef}, "SubChoreography not completed");`
    );
  }

  const participantsRef = isInstanced
    ? `processData[instanceID].participants[${transition.initiatorID}]`
    : `participants[${transition.initiatorID}]`;
  conditions.push(
    `require(msg.sender == ${participantsRef}, "Invalid initiator");`
  );

  if (transition.inFrom && isCallChoreography(transition.inFrom)) {
    conditions.push(
      `require(0 == ${transition.inFrom.name}.getTokenState(instanceList[${transition.inFrom.id}]), "Called choreography not completed");`
    );
  }

  if (transition.condition) {
    conditions.push(
      `require(${transition.condition}, "Decision condition not met");`
    );
  }

  return conditions.join("\n");
}

/**
 * Helper functions
 */
function isCallChoreography(call: Encoding.Call): boolean {
  return call?.type === CallType.CallChoreography;
}

function isSubChoreography(call: Encoding.Call): boolean {
  return call?.type === CallType.SubChoreography;
}