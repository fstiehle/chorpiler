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
  type: PlaceType = PlaceType.Flow;
}

export enum PlaceType {
  Flow = 0,
  Start = 1,
  End = 2
}

export class Transition extends Element {
  label: Label;
  
  constructor(id: string, label: Label) {
    super(id);
    this.label = label;
  }
}

export class Label {
  type: LabelType
  guards = new Map<string, Guard>();

  constructor(type: LabelType) {
    this.type = type;
  }
}

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

export enum LabelType {
  Start = 0,
  End = 1,
  Task = 2,
  ExclusiveIncoming = 3,
  ExclusiveOutgoing = 4,
  ParallelConverging = 5,
  ParallelDiverging = 6,
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