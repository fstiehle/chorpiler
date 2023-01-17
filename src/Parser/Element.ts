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

export interface Label { }

export class EventLabel implements Label { }

export class TaskLabel implements Label {
  sender: Participant
  receiver: Participant

  constructor(sender: Participant, receiver: Participant) {
    this.sender = sender;
    this.receiver = receiver;
  }
}

export enum GatewayType {
  Exclusive
}

export class GatewayLabel implements Label {
  type: GatewayType;

  constructor(type: GatewayType) {
    this.type = type;
  }
 }