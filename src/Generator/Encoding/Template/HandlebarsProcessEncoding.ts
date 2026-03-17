import * as Encoding from "../Encoding.js";
import { CompileOptions } from "../../TemplateEngine.js";
import { Participant } from "./Participant.js";
import { CaseVariable } from "./CaseVariable.js";
import { State } from "./State.js";
import { TaskWithCaseVar } from "./TaskWithCaseVar.js";
import { Transition } from "./Transition.js";
import { TransitionTarget } from "./TransitionTarget.js";
import { CallType } from "../../../Parser/Elements/Call.js";

export class HandlebarsProcessEncoding {
  constructor(
    public id: string, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public participants: Participant[],
    public callList: Encoding.Call[],
    public caseVariables: CaseVariable[],
    public states: State[],
    public taskWithCaseVar: TaskWithCaseVar[],
  ) {}

  // Template helper properties for Handlebars
  get hasStates(): boolean {
    return this.states.length > 0;
  }
  get hasCalls(): boolean {
    return this.callList.length > 0;
  }
  get hasTaskWithCaseVar(): boolean {
    return this.taskWithCaseVar.length > 0;
  }
  get numberOfParticipants(): string {
    return this.participants.length.toString();
  }
  get numberOfCalls(): string {
    return this.callList.length.toString();
  }

  static fromEncoding(
    encoding: Encoding.Process,
    options: CompileOptions,
    isInstanced: boolean = false,
  ): HandlebarsProcessEncoding {
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
                this.convertTransition(transition, options, isInstanced),
                transition.message,
              ),
            );
          }
        }
      });
    });

    return new HandlebarsProcessEncoding(
      encoding.id.toString(),
      encoding.modelID,
      Array.from(encoding.participants.values()).map(
        (p) => new Participant(p.id.toString(), p.modelID, p.name, p.address),
      ),
      Array.from(encoding.callList.values()),
      Array.from(encoding.caseVariables.values()).map(
        (c) => new CaseVariable(c.name, c.type, c.expression, c.setters),
      ),
      HandlebarsProcessEncoding.convertStates(
        states,
        options,
        isInstanced,
        transitionsWithCaseVar,
      ),
      taskWithCaseVar,
    );
  }

  private static convertStates(
    states: Map<number, Encoding.Transition[]>,
    options: CompileOptions,
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
          options,
          consume.toString(),
          filteredTransitions.map((t) =>
            this.convertTransition(t, options, isInstanced),
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
    options: CompileOptions,
    isInstanced: boolean,
  ): Transition {
    return new Transition(
      options,
      t.consume.toString(),
      t.produce.toString(),
      t instanceof Encoding.TaskTransition ? t.taskID.toString() : "",
      t instanceof Encoding.InitiatedTransition ? t.modelID : "",
      t instanceof Encoding.InitiatedTransition ? t.initiatorID.toString() : "",
      t instanceof Encoding.InitiatedTransition ? t.taskName : "",
      t.condition ?? "",
      t.isEnd,
      t.defaultBranch,
      t.outTo ? HandlebarsProcessEncoding.buildTransitionTarget(t.outTo) : null,
      t.inFrom ? HandlebarsProcessEncoding.buildTransitionTarget(t.inFrom) : null,
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

function isCallChoreography(call: Encoding.Call): boolean {
  return call?.type === CallType.CallChoreography;
}

function isSubChoreography(call: Encoding.Call): boolean {
  return call?.type === CallType.SubChoreography;
}