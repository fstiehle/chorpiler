export class Transition {
  constructor(
    public consume: string,
    public produce: string,
    public isEnd: boolean,
    public condition: string
  ) {}
}
export class IDTransition extends Transition {
  constructor(
    consume: string,
    produce: string,
    isEnd: boolean,
    condition: string,
    public id: string
  ) {
    super(consume, produce, isEnd, condition);
  }
}
export class ManualTransition extends IDTransition {
  constructor(
    consume: string,
    produce: string,
    isEnd: boolean,
    condition: string,
    id: string,
    public initiator: string
  ) {
    super(consume, produce, isEnd, condition, id);
  }
}

export class TemplateOptions {
  // note: number = 0 is interpreted as false value
  // and may not be displayed by the template engine, 
  // thus, prefer string type
  numberOfParticipants = "0";
  caseVariables = new Array<{
    name: string,
    type: string,
    expression: string,
    setters: boolean
  }>();
  participants = new Array<{
    id: string; // ID in form 0...n assigned by generator
    modelID: string; // ID as in model
    name: string;
    address: string;
  }>();

  preAutoTransitions = {
    if: Array<IDTransition>(),
    else: Array<Transition>()
  }

  manualTransitions = {
    if: new Array<ManualTransition>()
  }

  postAutoTransitions = {
    if: Array<Transition>()
  }

  hasManualTransitions = false;
  hasPreAutoTransitions = false;
  hasPostAutoTransitions = false;
}