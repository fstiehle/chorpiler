import { assert } from "console";
import * as Encoding from "./Encoding.js";
import { IFromEncoding } from "./IFromEncoding.js";
import { capitalize } from "../../util/helpers.js";
import { CompileOptions } from "../TemplateEngine.js";
import { CallType } from "../../Parser/Element.js";

class MustacheProcessEncoding {
  constructor(
    public id: string, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public participants: Participant[],
    public callContracts: Map<string, number>,
    public caseVariables: CaseVariable[],
    public states: State[],
  ) {}

  // Template helper methods
  hasStates = (): boolean => this.states.length > 0;
  hasCalls = (): boolean => this.callContracts.size > 0;
  numberOfParticipants = (): string => this.participants.length.toString();
  numberOfCalls = (): string => this.callContracts.size.toString();

  static fromEncoding(encoding: Encoding.Process) {
    const states = new Map<number, Encoding.Transition[]>();
    encoding.states.forEach((transitions, consume) => {
      states.set(consume, transitions);
    });
    return new MustacheProcessEncoding(
      encoding.id.toString(),
      encoding.modelID,
      Array.from(encoding.participants.values()).map(
        (p) => new Participant(p.id.toString(), p.modelID, p.name, p.address),
      ),
      encoding.callList,
      Array.from(encoding.caseVariables.values()).map(
        (c) => new CaseVariable(c.name, c.type, c.expression, c.setters),
      ),
      MustacheProcessEncoding.convertStates(states),
    );
  }

  private static convertStates(
    states: Map<number, Encoding.Transition[]>,
  ): State[] {
    const stateArray = Array.from(states.entries()).map(
      ([consume, transitions]) => {
        return new State(
          consume.toString(),
          transitions.map((t) => this.convertTransition(t)),
        );
      },
    );

    if (stateArray.length > 0) {
      stateArray[stateArray.length - 1].last = true;
    }
    return stateArray;
  }

  private static convertTransition(t: Encoding.Transition): Transition {
    return new Transition(
      t.consume.toString(),
      t.produce.toString(),
      t instanceof Encoding.TaskTransition ? t.taskID.toString() : "",
      t instanceof Encoding.InitiatedTransition ? t.modelID : "",
      t instanceof Encoding.InitiatedTransition ? t.initiatorID.toString() : "",
      t instanceof Encoding.InitiatedTransition ? t.taskName : "",
      t.condition ?? "",
      t.isEnd,
      t.defaultBranch,
      t.outTo ? MustacheProcessEncoding.buildTransitionTarget(t.outTo) : null,
      t.inFrom ? MustacheProcessEncoding.buildTransitionTarget(t.inFrom) : null,
      (t.outTo ? this.isCallChoreography(t.outTo) : false) ||
        (t.inFrom ? this.isCallChoreography(t.inFrom) : false),
      (t.outTo ? this.isSubChoreography(t.outTo) : false) ||
        (t.inFrom ? this.isSubChoreography(t.inFrom) : false),
    );
  }

  private static buildTransitionTarget(
    call: Encoding.Call,
  ): TransitionTarget | null {
    const isCall = this.isCallChoreography(call);
    const isSub = this.isSubChoreography(call);

    // Generate Solidity call string for call targets
    let callString: string | undefined = undefined;
    if (isCall) {
      if (call && call.participants) {
        const participantIds = call.participants
          .map((p) => `participants[${p.id}]`)
          .join(", ");
        callString = `callList[${call.id}].instance = callList[${call.id}].contract.instance([${participantIds}]);`;
      }
    }
    console.log(isCall, isSub);
    return new TransitionTarget(call.name, isCall, isSub, callString);
  }

  /**
   * Helper function to check if a transition target is a call choreography
   */
  private static isCallChoreography(call: Encoding.Call): boolean {
    return call?.type === CallType.CallChoreography;
  }

  /**
   * Helper function to check if a transition target is a sub choreography
   */
  private static isSubChoreography(call: Encoding.Call): boolean {
    return call?.type === CallType.SubChoreography;
  }
}

export class MustacheEncoding
  extends MustacheProcessEncoding
  implements IFromEncoding
{
  /**
   * Converts an `Encoding.Process` object to a Mustache template-ready object.
   *
   * @param encoding - The `Encoding.Process` object to convert.
   * @returns A new `MustacheEncoding` object.
   */

  constructor(
    public options: CompileOptions,
    public isCalled: boolean = false,
    public isInstanced: boolean = false,
    public subProcesses: MustacheProcessEncoding[] = [],
    ...args: ConstructorParameters<typeof MustacheProcessEncoding>
  ) {
    super(...args);
    //console.log(JSON.stringify(this.states));
  }

  hasSubProcesses = () => this.subProcesses.length > 0;
  numberOfProcesses = () => (this.subProcesses.length + 1).toString();

  static fromEncoding(encoding: Encoding.MainProcess): MustacheEncoding {
    const main = MustacheProcessEncoding.fromEncoding(encoding);
    const subProcesses = Array.from(encoding.subProcesses.values()).map(
      MustacheProcessEncoding.fromEncoding,
    );
    //console.log(encoding.states);

    return new MustacheEncoding(
      encoding.options,
      encoding.isCalled,
      encoding.isInstanced,
      subProcesses,
      main.id,
      main.modelID,
      main.participants,
      main.callContracts,
      main.caseVariables,
      main.states,
    );
  }
}

// Mustache doesn't render the number 0 (falsy value), so we need to use strings
class Transition {
  public conditions: any = [];
  public conditionString: string = "";

  constructor(
    public consume: string,
    public produce: string,
    public taskID: string,
    public modelID: string, // ID as was found in model
    public initiator: string,
    public taskName: string,
    public decision: string,
    public isEnd: boolean,
    public defaultBranch: boolean,
    public outTo: TransitionTarget | null,
    public inFrom: TransitionTarget | null,
    public isCall: boolean,
    public isSub: boolean,
  ) {
    const conditionParts: string[] = [];

    if (this.taskID) {
      conditionParts.push(`${this.taskID} == id`);
      this.conditions.push({ content: this.taskID, hasID: true, last: false });
    }
    if (this.inFrom && this.inFrom.isSub) {
      conditionParts.push(`0 == tokenState[${this.inFrom.id}]`);
      this.conditions.push({
        content: this.inFrom.id,
        hasInFrom: true,
        last: false,
      });
    }

    if (this.inFrom && !this.inFrom.isSub && !this.inFrom.isCall) {
      conditionParts.push(`0 == tokenState[${this.inFrom.id}]`);
      this.conditions.push({
        content: this.inFrom.id,
        hasInFrom: true,
        last: false,
      });
    }

    if (this.initiator) {
      conditionParts.push(`msg.sender == participants[${this.initiator}]`);
      this.conditions.push({
        content: this.initiator,
        hasInitiator: true,
        last: false,
      });
    }

    if (this.inFrom && this.inFrom.isCall) {
      conditionParts.push(
        `0 == ICalledProcessExecution(callList[${this.inFrom.id}]).tokenState()`,
      );
      this.conditions.push({
        content: this.inFrom.id,
        hasInFrom: true,
        last: false,
      });
    }

    this.conditionString = conditionParts.join(" && ");

    if (this.conditions.length > 0) {
      this.conditions[this.conditions.length - 1].last = true;
    }
  }

  hasConditions = () => {
    return this.conditions.length > 0;
  };
}

class State {
  constructor(
    public consume: string,
    public transitions: Transition[],
    public isDecision: boolean = false,
    public last: boolean | null = null,
  ) {
    const defaultBranches = this.transitions.filter((t) => t.defaultBranch);
    const decisions = this.transitions.filter((t) => t.decision);
    assert(defaultBranches.length <= 1);
    if (decisions.length > 0) {
      this.isDecision = true;
      this.transitions = [
        ...this.transitions.filter((t) => !t.defaultBranch),
        ...defaultBranches,
      ];
      if (transitions.length > 0 && defaultBranches.length === 1) {
        assert(
          transitions[transitions.length - 1].defaultBranch,
          "The last transition must be the defaultBranch.",
        );
      }
    }
  }
}

class Participant {
  constructor(
    public id: string, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public name: string,
    public address: string,
  ) {}
}

class TransitionTarget {
  constructor(
    public id: string,
    public isCall?: boolean,
    public isSub?: boolean,
    public callString?: string,
  ) {}
}

/**
 * Represents a case variable that can be used in the generated contract
 */
class CaseVariable {
  public functionName: string;

  constructor(
    public name: string,
    public type: string,
    public expression: string,
    public setters: boolean,
  ) {
    this.functionName = "set" + capitalize(name);
  }
}
