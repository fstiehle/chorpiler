import { CallType } from "../../Parser/Element.js";
import { CompileOptions } from "../TemplateEngine.js";

export class Process {
  public participants = new Map<string, Participant>();
  public callList = new Map<string, Call>();
  public transitions = new Map<string, Transition>();
  public states = new Map<number, Transition[]>();
  caseVariables = new Map<string, CaseVariable>();
  public modelID = ""; // ID as was found in model

  constructor(
    public id: number, // ID in form 0...n assigned by generator
  ) {}

  addTransition(netID: string, transition: Transition) {
    this.transitions.set(netID, transition);

    if (!this.states.has(transition.consume)) {
      this.states.set(transition.consume, []);
    }
    this.states.get(transition.consume)!.push(transition);
  }
}

export class SubProcess extends Process {
  sourceIDs: string[] = []; // transition in the parent process before this sub process
  targetIDs: string[] = []; // transition in the parent process after this sub process
}

export class MainProcess extends Process {
  public options: CompileOptions = {
    unfoldSubNets: false,
    loopProtection: true,
    events: false,
    debug: false,
  };
  constructor() {
    super(0);
  }
  subProcesses = new Map<string, SubProcess>();
  isCalled = false;
  isInstanced = false;
}

export class Call {
  constructor(
    public name: string,
    public id: number,
    public type: CallType,
    public participants: Participant[] | null,
  ) {}
}

export class CaseVariable {
  constructor(
    public name: string,
    public type: string,
    public expression: string,
    public setters: boolean,
  ) {}
}

interface TransitionParams {
  id: string;
  consume: number;
  produce: number;
  condition?: string | null;
  isEnd?: boolean;
  defaultBranch?: boolean;
  outTo?: Call | null;
  inFrom?: Call | null;
}

export class Transition {
  public id: string;
  public consume: number;
  public produce: number;
  public condition: string | null;
  public isEnd: boolean;
  public defaultBranch: boolean;
  public outTo: Call | null;
  public inFrom: Call | null;

  constructor({
    id,
    consume,
    produce,
    condition = null,
    isEnd = false,
    defaultBranch = false,
    outTo = null,
    inFrom = null,
  }: TransitionParams) {
    this.id = id;
    this.consume = consume;
    this.produce = produce;
    this.condition = condition;
    this.isEnd = isEnd;
    this.defaultBranch = defaultBranch;
    this.outTo = outTo;
    this.inFrom = inFrom;
  }
}

interface TaskTransitionParams extends TransitionParams {
  taskID: number;
}

export class TaskTransition extends Transition {
  public taskID: number;

  constructor({ taskID, ...transitionParams }: TaskTransitionParams) {
    super(transitionParams);
    this.taskID = taskID;
  }
}

interface InitiatedTransitionParams extends TaskTransitionParams {
  modelID: string;
  initiatorID: number;
  taskName: string;
}

export class InitiatedTransition extends TaskTransition {
  public modelID: string;
  public initiatorID: number;
  public taskName: string;

  constructor({
    modelID,
    initiatorID,
    taskName,
    ...transitionParams
  }: InitiatedTransitionParams) {
    super(transitionParams);
    this.modelID = modelID;
    this.initiatorID = initiatorID;
    this.taskName = taskName;
  }
}

export class Participant {
  constructor(
    public id: number, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public name: string,
    public address: string,
  ) {}
}
