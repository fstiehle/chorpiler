import { assert } from "console";
import * as Encoding from "./Encoding.js";
import { IFromEncoding } from "./IFromEncoding.js";
import { capitalize } from "../../util/helpers.js";
import { CompileOptions } from "../TemplateEngine.js";

class MustacheProcessEncoding {
  constructor(
    public id: string, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public participants: Participant[],
    public caseVariables: CaseVariable[],
    public states: State[],
  ) {}

  hasStates = () => this.states.length > 0;
  numberOfParticipants = () => this.participants.length.toString();

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
      t.outTo !== null
        ? { id: t.outTo.id.toString(), produce: t.outTo.produce.toString() }
        : null,
    );
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

  hasSubProcesses = () => this.subProcesses.length > 0;
  numberOfProcesses = () => (this.subProcesses.length + 1).toString();

  constructor(
    public options: CompileOptions,
    public subProcesses: MustacheProcessEncoding[] = [],
    ...args: ConstructorParameters<typeof MustacheProcessEncoding>
  ) {
    super(...args);
    //console.log(JSON.stringify(this.states));
  }

  static fromEncoding(encoding: Encoding.MainProcess): MustacheEncoding {
    const main = MustacheProcessEncoding.fromEncoding(encoding);
    const subProcesses = Array.from(encoding.subProcesses.values()).map(
      MustacheProcessEncoding.fromEncoding,
    );
    //console.log(encoding.states);

    return new MustacheEncoding(
      encoding.options,
      subProcesses,
      main.id,
      main.modelID,
      main.participants,
      main.caseVariables,
      main.states,
    );
  }
}

// Mustache doesn't render the number 0 (falsy value), so we need to use strings
class Transition {
  public conditions: any = [];

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
    public outTo: { id: string; produce: string } | null,
  ) {
    if (this.taskID) {
      this.conditions.push({ content: this.taskID, hasID: true, last: false });
    }
    if (this.initiator) {
      this.conditions.push({
        content: this.initiator,
        hasInitiator: true,
        last: false,
      });
    }
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

class CaseVariable {
  constructor(
    public name: string,
    public type: string,
    public expression: string,
    public setters: boolean,
  ) {
    this.functionName = "set" + capitalize(name);
  }

  public functionName: string;
}
