import { Participant } from "./Participant";

export class Element {
  id: string;
  source = new Array<Element>();
  target = new Array<Element>(); 
  
  constructor(id: string) {
    this.id = id;
  }
}

export class Place extends Element { 
  constructor(id: string, public type: PlaceType = PlaceType.Flow) {
    super(id);
    this.type = type;
  }
}

export enum PlaceType {
  Flow = 0,
  Start = 1,
  End = 2,
  UncontrolledMerge = 3
}

export class Transition extends Element {
  label: Label;
  
  constructor(id: string, label: Label) {
    super(id);
    this.label = label;
  }
}

// Transitions can have labels
export class Label {
  type: LabelType
  guards = new Map<string, Guard>();

  constructor(type: LabelType) {
    this.type = type;
  }
}

// Labels can have guards
export class Guard {
  default: boolean = false;
  condition: string = "";
  // condition expression language, e.g., 'Solidity'
  language: string = "";

  constructor(
    public name: string,
    _default?: boolean) {
    
      if (_default != null)
        this.default = _default;
  }
}

// TODO: Non allignend naming incoming/outgoing vs. diverging/converging
export enum LabelType {
  Start = 0,
  End = 1,
  Task = 2,
  DataExclusiveIncoming = 3,
  DataExclusiveOutgoing = 4,
  ParallelConverging = 5,
  ParallelDiverging = 6,
  EventExclusiveIncoming = 7,
  EventExclusiveOutgoing = 8,
}

export class TaskLabel extends Label {
  sender: Participant
  receiver: Participant
  name: String;

  constructor(sender: Participant, receiver: Participant, name: String) {
    super(LabelType.Task);
    this.sender = sender;
    this.receiver = receiver;
    this.name = name;
  }
}