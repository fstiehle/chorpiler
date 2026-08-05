import * as Encoding from "../../Encoding.js";
import { CallType } from "../../../../Parser/Elements/Call.js";
import { OutTo } from "./OutTo.js";
import { Options } from "./Options.js";
import { Decision } from "./Decision.js";
import { buildTokenStateRef, buildParticipantsRef } from "./varNames.js";

/**
 * Represents a transition in the template encoding.
 * Used for rendering individual transitions within states.
 *
 * Template expressions used from transition.handlebars.sol and firing.handlebars.sol:
 * - modelID: task model identifier (optional, for named transitions)
 * - taskName: human-readable task name (optional)
 * - hasConditions: whether there are additional conditions to check
 * - conditionString: conditions to validate (e.g., initiator, sub-choreography completion)
 * - consume: token to consume
 * - produce: token to produce (optional)
 * - outTo: target for call/sub-choreography (optional)
 * - isSub: whether this targets a sub-choreography
 * - isCall: whether this targets a call-choreography
 * - taskID: numeric task identifier (optional)
 * - isEnd: whether this is an end transition
 * - initiator: whether this transition has an initiator
 * - isDecision: whether this is part of a decision (for parent state)
 * - defaultBranch: whether this is the default branch of a decision
 * - decision: decision condition expression
 *
 * Propagated properties (for nested partials):
 * - options: compile options (for event emission in firing.handlebars.sol)
 * - isInstanced: whether the process supports instances
 * - hasSubProcesses: whether the contract has sub-processes
 */
export class Transition {
  constructor(
    public modelID: string | null,
    public taskName: string | null,
    public hasConditions: boolean,
    public conditionString: string,
    public consume: string,
    public produce: string | null,
    public outTo: OutTo | null,
    public taskID: string | null,
    public initiator: string | null,
    public defaultBranch: boolean,
    public decision: string | null,
    public options: Options,
    public isInstanced: boolean,
    public hasSubProcesses: boolean,
  ) { }

  isSub = () => this.outTo !== null && this.outTo.isSub;
  isCall = () => this.outTo !== null && this.outTo.isCall;
  isEnd = () => this.produce === "0";
  hasProduce = () => this.produce !== null
  isDecision = () => this.decision !== null || this.defaultBranch;
  isNotDefaultBranch = () => !this.defaultBranch;

  /**
   * Creates a Transition instance from an Encoding.Transition.
   */
  static fromEncoding(
    t: Encoding.Transition,
    isInstanced: boolean,
    options: Options,
    caseVariables: Map<string, Encoding.CaseVariable>,
    hasSubProcesses: boolean
  ): Transition {
    const isTaskTransition = t instanceof Encoding.TaskTransition;
    const isInitiatedTransition = t instanceof Encoding.InitiatedTransition;

    // Build condition string for inline conditions (not require statements)
    const conditions: string[] = [];

    if (isTaskTransition) {
      const taskTrans = t as Encoding.TaskTransition;
      conditions.push(`${taskTrans.taskID} == id`);
    }

    if (t.inFrom && isSubChoreography(t.inFrom)) {
      const tokenStateRef = buildTokenStateRef(t.inFrom.id, isInstanced);
      conditions.push(`0 == ${tokenStateRef}`);
    }

    if (isInitiatedTransition) {
      const initiated = t as Encoding.InitiatedTransition;
      const participantsRef = buildParticipantsRef(initiated.initiatorID, isInstanced);
      conditions.push(`msg.sender == ${participantsRef}`);
    }

    if (t.inFrom && isCallChoreography(t.inFrom)) {
      conditions.push(
        `0 == ${t.inFrom.name}.getTokenState(instanceList[${t.inFrom.id}])`
      );
    }

    const conditionString = conditions.join(" && ");

    // Build OutTo if present
    let outTo: OutTo | null = null;
    let participants = "";
    if (t.outTo) {
      const isSub = isSubChoreography(t.outTo);
      const isCall = isCallChoreography(t.outTo);
      if (isCall && t.outTo.participants) {
        participants = t.outTo.participants
          .map(p => buildParticipantsRef(p.id, isInstanced))
          .join(", ");
      }

      outTo = new OutTo(
        t.outTo.id.toString(),
        t.outTo.name.toString(),
        isSub,
        isCall,
        participants
      );
    }

    // Process decision condition using Decision class
    const condition = Decision.fromEncoding(t.condition, caseVariables, isInstanced);

    return new Transition(
      isInitiatedTransition ? (t as Encoding.InitiatedTransition).modelID : null,
      isInitiatedTransition ? (t as Encoding.InitiatedTransition).taskName : null,
      conditions.length > 0,
      conditionString,
      t.consume.toString(),
      t.produce !== null ? t.produce.toString() : null,
      outTo,
      isTaskTransition ? (t as Encoding.TaskTransition).taskID.toString() : null,
      isInitiatedTransition ? (t as Encoding.InitiatedTransition).initiatorID.toString() : null,
      t.defaultBranch,
      condition.expression,
      options,
      isInstanced,
      hasSubProcesses
    );
  }
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