export class Process {
  public participants = new Map<string, Participant>();
  public transitions = new Map<string, Transition>();
  public states = new Map<number, Transition[]>();
  caseVariables = new Map<string, CaseVariable>();

  constructor(
    public id: number, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
  ) {}

  addTransition(netID: string, transition: Transition) {
    this.transitions.set(netID, transition);

    if (!this.states.has(transition.consume)) {
      this.states.set(transition.consume, []);
    }
    this.states.get(transition.consume)!.push(transition);
  }
}

export class MainProcess extends Process {
  constructor(
    modelID: string, // ID as was found in model
  ) {
    super(0, modelID);
  }
  subProcesses = new Map<string, Process>();
}

export class CaseVariable {
  constructor(
    public name: string,
    public type: string,
    public expression: string,
    public setters: boolean
  ) {}
}

interface TransitionParams {
  consume: number;
  produce: number;
  condition?: string | null;
  isEnd?: boolean;
  defaultBranch?: boolean;
  outTo?: number | null;
  inFrom?: number | null;
}

export class Transition {
  constructor({
    consume,
    produce,
    condition = null,
    isEnd = false,
    defaultBranch = false,
    outTo = null,
    inFrom = null
  }: TransitionParams) {
    this.consume = consume;
    this.produce = produce;
    this.condition = condition;
    this.isEnd = isEnd;
    this.defaultBranch = defaultBranch;
    this.outTo = outTo;
    this.inFrom = inFrom;
  }

  public consume: number;
  public produce: number;
  public condition: string | null;
  public isEnd: boolean;
  public defaultBranch: boolean;
  public outTo: number | null;
  public inFrom: number | null;
}

interface TaskTransitionParams extends TransitionParams {
  taskID: number;
}

export class TaskTransition extends Transition {
  public taskID: number;

  constructor({
    taskID,
    ...transitionParams
  }: TaskTransitionParams) {
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
    public address: string
  ) {}
}