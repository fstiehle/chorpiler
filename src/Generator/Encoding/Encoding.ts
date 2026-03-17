import { CallType } from "../../Parser/Elements/Call.js";
import { Message } from "../../Parser/Elements/Message.js";
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
  public numberOfParticipants = 0;

  constructor(
    public name: string,
    public id: number,
    public type: CallType,
    public participants: Participant[] | null,
    public address: string = "",
  ) {
    this.numberOfParticipants = participants?.length ?? 0;
  }
}

export class CaseVariable {
  public linkedMessage: Message | null = null;
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
  message?: Message | null;
}

export class InitiatedTransition extends TaskTransition {
  public modelID: string;
  public initiatorID: number;
  public taskName: string;
  public message: Message | null;

  constructor({
    modelID,
    initiatorID,
    taskName,
    message = null,
    ...transitionParams
  }: InitiatedTransitionParams) {
    super(transitionParams);
    this.modelID = modelID;
    this.initiatorID = initiatorID;
    this.taskName = taskName;
    this.message = message;
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
