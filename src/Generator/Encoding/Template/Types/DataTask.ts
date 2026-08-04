import * as Encoding from "../../Encoding.js";
import { CallType } from "../../../../Parser/Elements/Call.js";
import { Options } from "./Options.js";
import { Decision } from "./Decision.js";
import { buildTokenStateRef, buildParticipantsRef } from "./varNames.js";

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
    subProcessCallback: string | null,
    caseVariables: Map<string, Encoding.CaseVariable>
  ): DataTask {
    if (!transition.message?.caseVariable) {
      throw new Error("DataTask requires a transition with a caseVariable");
    }

    const caseVar = transition.message.caseVariable;
    const conditionString = buildConditionString(transition, isInstanced, caseVariables);

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
  isInstanced: boolean,
  caseVariables: Map<string, Encoding.CaseVariable>
): string {
  const conditions: string[] = [];

  if (transition.inFrom && isSubChoreography(transition.inFrom)) {
    const tokenStateRef = buildTokenStateRef(transition.inFrom.id, isInstanced);
    conditions.push(
      `require(0 == ${tokenStateRef}, "SubChoreography not completed");`
    );
  }

  const participantsRef = buildParticipantsRef(transition.initiatorID, isInstanced);
  conditions.push(
    `require(msg.sender == ${participantsRef}, "Invalid initiator");`
  );

  if (transition.inFrom && isCallChoreography(transition.inFrom)) {
    conditions.push(
      `require(0 == ${transition.inFrom.name}.getTokenState(instanceList[${transition.inFrom.id}]), "Called choreography not completed");`
    );
  }

  if (transition.condition) {
    // Use Decision class to handle case variable references
    const condition = Decision.fromEncoding(transition.condition, caseVariables, isInstanced);
    if (condition.expression) {
      conditions.push(
        `require(${condition.expression}, "Decision condition not met");`
      );
    }
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