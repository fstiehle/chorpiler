import Participant from "./Participant";
import Place from "./Place";

export enum GatewayType {
  Exclusive
}

export class Transition {
  id: string;
  label: Label;
  in: Place[] = new Array<Place>;
  out: Place[] = new Array<Place>;

  constructor(id: string, label: Label) {
    this.id = id;
    this.label = label;
  }
}

export interface Label { }

export class TaskLabel implements Label {
  sender: Participant
  receiver: Participant

  constructor(sender: Participant, receiver: Participant) {
    this.sender = sender;
    this.receiver = receiver;
  }
}

export class EventLabel implements Label { }

export class GatewayLabel implements Label {
  type: GatewayType;

  constructor(type: GatewayType) {
    this.type = type;
  }
 }