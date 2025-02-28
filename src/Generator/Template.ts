class Transitions {
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

class Transition {
  constructor(
    public consume: string,
    public produce: string,
    public isEnd: boolean,
    public condition: string,
    public outTo: string|null = null, // transition leads to subnet with id @outTo
    public inFrom: string|null = null // transition enters from subnet with id @inFrom
  ) { }
}
class IDTransition extends Transition {
  constructor(
    public id: string,
    ...args: ConstructorParameters<typeof Transition>
  ) {
    super( ...args);
  }
}
class ManualTransition extends IDTransition {
  constructor(
    id: string,
    public initiator: string,
    ...args: ConstructorParameters<typeof Transition>
  ) {
    super(id, ...args);
  }
}

class Participant {
  constructor(
    public id: string, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public name: string,
    public address: string
  ) {}
};

class SubProcess {
  hasSubProcesses = () => this.subprocesses.length > 0;

  constructor(
    public id: string, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public participants: Participant[],
    public transitions: Transitions,
    public subprocesses = new Array<SubProcess>
  ) {}
}

class Process {
  // note: number = 0 is interpreted as false value
  // and may not be displayed by the template engine, 
  // thus, prefer string type
  numberOfParticipants = "0";
  participants = new Array<Participant>();

  caseVariables = new Array<{
    name: string,
    type: string,
    expression: string,
    setters: boolean
  }>();

  subProcesses = new Array<SubProcess>
  hasSubProcesses = () => this.subProcesses.length > 0;

  transitions = new Transitions();
  hasManualTransitions = () => this.transitions.manual.if.length > 0;
  hasPreAutoTransitions = () => this.transitions.preAuto.if.length > 0 || this.transitions.preAuto.else.length > 0;
  hasPostAutoTransitions = () => this.transitions.postAuto.if.length;
}

export const Template = {
  Transitions,
  Transition,
  IDTransition,
  ManualTransition,
  Participant,
  SubProcess,
  Process
};