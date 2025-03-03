export class Process {
  id: string | null = null;
  modelID: string| null = null;
  caseVariables = new Map<string, CaseVariable>();
  subProcesses = new Map<string, SubProcess>
  participants = new Map<string, Participant>();
  transitions = new Transitions();
}

export class Transitions {
  preAuto = {
    if: Array<IDTransition>(),
    else: Array<Transition>()
  }
  manual = {
    if: new Array<ManualTransition>()
  }
  postAuto = {
    if: Array<Transition>()
  }
}

export class CaseVariable {
  constructor(
    public name: string,
    public type: string,
    public expression: string,
    public setters: boolean
  ) {}
}

export class Transition {
  constructor(
    public consume: number,
    public produce: number,
    public isEnd: boolean,
    public condition: string,
    public outTo: number|null = null, // transition leads to subnet with id @outTo
    public inFrom: number|null = null // transition enters from subnet with id @inFrom
  ) { }
}
export class IDTransition extends Transition {
  constructor(
    public id: number, // ID in form 0...n assigned by generator
    ...args: ConstructorParameters<typeof Transition>
  ) {
    super( ...args);
  }
}
export class ManualTransition extends IDTransition {
  constructor(
    id: number,
    public modelID: string, // ID as was found in model
    public initiatorID: number,
    ...args: ConstructorParameters<typeof Transition>
  ) {
    super(id, ...args);
  }
}

export class Participant {
  constructor(
    public id: number, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public name: string,
    public address: string
  ) {}
};

export class SubProcess {
  public participants = new Map<string, Participant>();
  public transitions = new Transitions();

  constructor(
    public id: number, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
  ) {}
}