import { Participant } from "./Participant";

export class Element {
  public source = new Array<Element>();
  public target = new Array<Element>(); 

  constructor(public id: string) {}
}

export class Place extends Element { 
  public source = new Array<Transition>();
  public target = new Array<Transition>(); 

  constructor(id: string, public type: PlaceType = PlaceType.Flow) {
    super(id);
  }
}

export enum PlaceType {
  Flow = 0,
  Start = 1,
  End = 2
}

export class Transition extends Element {
  source = new Array<Place>();
  target = new Array<Place>(); 

  constructor(id: string, public label: Label) {
    super(id);
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

export class EventLabel extends Label {
  constructor(
    public sender: Participant, 
    public receiver: Participant[], 
    public name: string,
    public modelID: string,
    labelType: LabelType) {
      super(labelType);
  }
}

export class TaskLabel extends EventLabel {
  constructor(sender: Participant, receiver: Participant[], name: string, modelID: string,
    public taskType: TaskType = TaskType.Task) { 
    super(sender, receiver, name, modelID, LabelType.Task,);
  }
}

export class SubChoreographyTaskLabel extends TaskLabel {
  constructor(sender: Participant, receiver: Participant[], name: string, modelID: string, 
    public chorID: number,
    type: TaskType.SubChoreography | TaskType.CallChoreography) {
    super(sender, receiver, name, modelID, type);
  }
}

// TODO: LabelTypes might be Reduntant? 
// Below cannot be relied upon anyway, as these could get reduced,
// Task is its own class anyway, maybe LabelType Manual or Silent is enough
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