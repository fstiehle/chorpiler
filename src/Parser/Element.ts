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
  guards = new Map<string, Guard>();
  constructor(public type: LabelType) { }
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
  Start,
  End,
  Task,
  DataExclusiveIncoming,
  DataExclusiveOutgoing,
  ParallelConverging ,
  ParallelDiverging,
  EventExclusiveIncoming,
  EventExclusiveOutgoing,
}

export enum TaskType {
  Task,
  SubChoreography,
  CallChoreography
}

export class TaskLabel extends Label {
  constructor(
    public sender: Participant, 
    public receiver: Participant[], 
    public name: string, 
    public taskType: TaskType = TaskType.Task) {
      super(LabelType.Task);
  }
}