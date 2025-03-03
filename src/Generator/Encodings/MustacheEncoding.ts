import * as Encoding from "../Encoding";
import { IFromEncoding } from "./IFromEncoding";

export class MustacheEncoding implements IFromEncoding {
  static fromEncoding(encoding: Encoding.Process): MustacheEncoding {
    const participants = Array.from(encoding.participants.values()).map(
      (p) => new Participant(p.id.toString(), p.modelID, p.name, p.address)
    );

    const caseVariables = [...encoding.caseVariables.values()];
    const transitions = new Transitions();

    transitions.preAuto.if = encoding.transitions.preAuto.if.map(
      (t) =>
        new IDTransition(
          t.id.toString(),
          t.consume.toString(),
          t.produce.toString(),
          t.isEnd,
          t.condition,
          t.outTo?.toString() ?? null,
          t.inFrom?.toString() ?? null
        )
    );

    transitions.preAuto.else = encoding.transitions.preAuto.else.map(
      (t) =>
        new Transition(
          t.consume.toString(),
          t.produce.toString(),
          t.isEnd,
          t.condition,
          t.outTo?.toString() ?? null,
          t.inFrom?.toString() ?? null
        )
    );

    transitions.manual.if = encoding.transitions.manual.if.map(
      (t) =>
        new ManualTransition(
          t.id.toString(),
          t.modelID,
          t.initiatorID.toString(),
          t.consume.toString(),
          t.produce.toString(),
          t.isEnd,
          t.condition,
          t.outTo?.toString() ?? null,
          t.inFrom?.toString() ?? null
        )
    );

    transitions.postAuto.if = encoding.transitions.postAuto.if.map(
      (t) =>
        new Transition(
          t.consume.toString(),
          t.produce.toString(),
          t.isEnd,
          t.condition,
          t.outTo?.toString() ?? null,
          t.inFrom?.toString() ?? null
        )
    );

    const subProcesses = Array.from(encoding.subProcesses.values()).map(
      (sp) =>
        new SubProcess(
          sp.id.toString(),
          sp.modelID,
          Array.from(sp.participants.values()).map(
            (p) => new Participant(p.id.toString(), p.modelID, p.name, p.address)
          ),
          new Transitions()
        )
    );

    return new MustacheEncoding(participants, caseVariables, transitions, subProcesses);
  }

  constructor(
    public participants: Array<Participant>,
    public caseVariables: Array<Encoding.CaseVariable>,
    public transitions: Transitions,
    public subProcesses: Array<SubProcess>
  ) { }

  numberOfParticipants = () => this.participants.length.toString();
  hasSubProcesses = () => this.subProcesses.length > 0;
  hasManualTransitions = () => this.transitions.manual.if.length > 0;
  hasPreAutoTransitions = () => this.transitions.preAuto.if.length > 0 || this.transitions.preAuto.else.length > 0;
  hasPostAutoTransitions = () => this.transitions.postAuto.if.length;
}

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

// mustache doesn't render the number 0 (falsy value), so we need to use strings
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
    public id: string, // ID in form 0...n assigned by generator
    ...args: ConstructorParameters<typeof Transition>
  ) {
    super( ...args);
  }
}
class ManualTransition extends IDTransition {
  constructor(
    id: string,
    public modelID: string, // ID as was found in model
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
  constructor(
    public id: string, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public participants: Participant[] | null = null,
    public transitions: Transitions | null = null,
  ) {}
}