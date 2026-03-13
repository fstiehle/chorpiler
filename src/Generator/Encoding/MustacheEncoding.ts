import { assert } from "console";
import * as Encoding from "./Encoding.js";
import { IFromEncoding } from "./IFromEncoding.js";
import { capitalize } from "../../util/helpers.js";
import { CompileOptions } from "../TemplateEngine.js";
import { CallType } from "../../Parser/Elements/Call.js";
import { Message } from "../../Parser/Elements/Message.js";

class MustacheProcessEncoding {
  constructor(
    public id: string, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public participants: Participant[],
    public callList: Encoding.Call[],
    public caseVariables: CaseVariable[],
    public states: State[],
    public taskWithCaseVar: TaskWithCaseVar[],
  ) {}

  // Template helper methods
  hasStates = (): boolean => this.states.length > 0;
  hasCalls = (): boolean => this.callList.length > 0;
  hasTaskWithCaseVar = (): boolean => this.taskWithCaseVar.length > 0;
  numberOfParticipants = (): string => this.participants.length.toString();
  numberOfCalls = (): string => this.callList.length.toString();

  static fromEncoding(
    encoding: Encoding.Process,
    isInstanced: boolean = false,
  ) {
    const states = new Map<number, Encoding.Transition[]>();
    const taskWithCaseVar = new Array<TaskWithCaseVar>();
    const transitionsWithCaseVar = new Set<Encoding.Transition>();

    // Process each state and extract transitions with case variables
    encoding.states.forEach((transitions, consume) => {
      states.set(consume, transitions);
      transitions.forEach((transition) => {
        if (transition instanceof Encoding.InitiatedTransition) {
          if (transition.message?.caseVariable) {
            transitionsWithCaseVar.add(transition);
            taskWithCaseVar.push(
              new TaskWithCaseVar(
                consume.toString(),
                this.convertTransition(transition, isInstanced),
                transition.message,
              ),
            );
          }
        }
      });
    });

    return new MustacheProcessEncoding(
      encoding.id.toString(),
      encoding.modelID,
      Array.from(encoding.participants.values()).map(
        (p) => new Participant(p.id.toString(), p.modelID, p.name, p.address),
      ),
      Array.from(encoding.callList.values()),
      Array.from(encoding.caseVariables.values()).map(
        (c) => new CaseVariable(c.name, c.type, c.expression, c.setters),
      ),
      MustacheProcessEncoding.convertStates(
        states,
        isInstanced,
        transitionsWithCaseVar,
      ),
      taskWithCaseVar,
    );
  }

  private static convertStates(
    states: Map<number, Encoding.Transition[]>,
    isInstanced: boolean,
    excludeTransitions: Set<Encoding.Transition> = new Set(),
  ): State[] {
    const stateArray = Array.from(states.entries()).map(
      ([consume, transitions]) => {
        // Filter out transitions that are already in taskWithCaseVar
        const filteredTransitions = transitions.filter(
          (t) => !excludeTransitions.has(t),
        );

        return new State(
          consume.toString(),
          filteredTransitions.map((t) =>
            this.convertTransition(t, isInstanced),
          ),
        );
      },
    );

    if (stateArray.length > 0) {
      stateArray[stateArray.length - 1].last = true;
    }
    return stateArray;
  }

  private static convertTransition(
    t: Encoding.Transition,
    isInstanced: boolean,
  ): Transition {
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
      (t.outTo ? isCallChoreography(t.outTo) : false) ||
        (t.inFrom ? isCallChoreography(t.inFrom) : false),
      (t.outTo ? isSubChoreography(t.outTo) : false) ||
        (t.inFrom ? isSubChoreography(t.inFrom) : false),
      isInstanced,
    );
  }

  private static buildTransitionTarget(
    call: Encoding.Call,
  ): TransitionTarget | null {
    return new TransitionTarget(call);
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
    const main = MustacheProcessEncoding.fromEncoding(
      encoding,
      encoding.isInstanced,
    );
    const subProcesses = Array.from(encoding.subProcesses.values()).map(
      (subProcess) =>
        MustacheProcessEncoding.fromEncoding(subProcess, encoding.isInstanced),
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
      main.callList,
      main.caseVariables,
      main.states,
      main.taskWithCaseVar,
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
    public isInstanced: boolean,
  ) {
    const conditionParts: string[] = [];

    if (this.taskID) {
      conditionParts.push(`${this.taskID} == id`);
      this.conditions.push({ content: this.taskID, hasID: true, last: false });
    }
    if (this.inFrom && this.inFrom.isSub) {
      const tokenStateRef = this.isInstanced
        ? `processData[instanceID].tokenState[${this.inFrom.call.id}]`
        : `tokenState[${this.inFrom.call.id}]`;
      conditionParts.push(`0 == ${tokenStateRef}`);
      this.conditions.push({
        content: this.inFrom.call.id.toString(),
        hasInFrom: true,
        last: false,
      });
    }

    if (this.initiator) {
      const participantsRef = this.isInstanced
        ? `processData[instanceID].participants[${this.initiator}]`
        : `participants[${this.initiator}]`;
      conditionParts.push(`msg.sender == ${participantsRef}`);
      this.conditions.push({
        content: this.initiator,
        hasInitiator: true,
        last: false,
      });
    }

    if (this.inFrom && this.inFrom.isCall) {
      conditionParts.push(
        `0 == ${this.inFrom.call.name}.getTokenState(instanceList[${this.inFrom.call.id}])`,
      );
      this.conditions.push({
        content: this.inFrom.call.id.toString(),
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
  public isCall = false;
  public isSub = false;
  public callString: string | undefined = undefined;

  constructor(public call: Encoding.Call) {
    this.isCall = isCallChoreography(call);
    this.isSub = isSubChoreography(call);

    // Generate Solidity call string for call targets
    if (this.isCall) {
      if (call && call.participants) {
        const participantIds = call.participants
          .map((p) => `participants[${p.id}]`)
          .join(", ");
        this.callString = `instanceList[${call.id}] = ${call.name}.instance([${participantIds}]);`;
      }
    }
  }
}
/**
 * Represents a case variable that can be used in the generated contract.
 * Automatically assembles validation conditions from the linked message's transition,
 * following the same pattern as the Transition class but generating require statements
 * for Solidity contract validation.
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

class TaskWithCaseVar {
  public produce: string;
  public taskID: string | null;
  public modelID: string;
  public initiator: string;
  public taskName: string;
  public decision: string;
  public isEnd: boolean;
  public outTo: TransitionTarget | null;
  public inFrom: TransitionTarget | null;
  public isCall: boolean;
  public isSub: boolean;
  public isInstanced: boolean;
  public message: Message | null;
  public conditionParts: string[];
  public conditionString: string;

  constructor(
    public consume: string,
    public transition: Transition,
    message: Message | null = null,
  ) {
    this.produce = transition.produce;
    this.taskID = null; // No check on taskID as specified
    this.modelID = transition.modelID;
    this.initiator = transition.initiator;
    this.taskName = transition.taskName;
    this.decision = transition.decision;
    this.isInstanced = transition.isInstanced;
    this.isEnd = transition.isEnd;
    this.outTo = transition.outTo;
    this.inFrom = transition.inFrom;
    this.isCall = transition.isCall;
    this.isSub = transition.isSub;
    this.message = message;

    this.conditionParts = [];

    if (this.inFrom && this.inFrom.isSub) {
      const tokenStateRef = this.isInstanced
        ? `processData[instanceID].tokenState[${this.inFrom.call.id}]`
        : `tokenState[${this.inFrom.call.id}]`;
      this.conditionParts.push(
        `require(0 == ${tokenStateRef}, "SubChoreography not completed");`,
      );
    }

    if (this.initiator) {
      const participantsRef = this.isInstanced
        ? `processData[instanceID].participants[${this.initiator}]`
        : `participants[${this.initiator}]`;
      this.conditionParts.push(
        `require(msg.sender == ${participantsRef}, "Invalid initiator");`,
      );
    }

    if (this.inFrom && this.inFrom.isCall) {
      this.conditionParts.push(
        `require(0 == ${this.inFrom.call.name}.getTokenState(instanceList[${this.inFrom.call.id}]), "Called choreography not completed");`,
      );
    }

    if (this.decision) {
      this.conditionParts.push(
        `require(${this.decision}, "Decision condition not met");`,
      );
    }

    this.conditionString = this.conditionParts.join("\n");
  }
}

function isCallChoreography(call: Encoding.Call): boolean {
  return call?.type === CallType.CallChoreography;
}

function isSubChoreography(call: Encoding.Call): boolean {
  return call?.type === CallType.SubChoreography;
}
