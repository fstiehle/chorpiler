import Participant from "./Participant";

export class Element {
  id: string;
  source = new Array<Element>();
  target = new Array<Element>(); 
  
  constructor(id: string) {
    this.id = id;
  }
}

export class Place extends Element { }

export class Transition extends Element {
  label: Label;
  
  constructor(id: string, label: Label) {
    super(id);
    this.label = label;
  }
}

export class Label {
  type: LabelType
  constructor(type: LabelType) {
    this.type = type;
  }
}

export enum LabelType {
  Start = 0,
  End = 1,
  Task = 2,
  ExclusiveGateway = 3
}

export class TaskLabel extends Label {
  sender: Participant
  receiver: Participant

  constructor(sender: Participant, receiver: Participant) {
    super(LabelType.Task);
    this.sender = sender;
    this.receiver = receiver;
  }
}