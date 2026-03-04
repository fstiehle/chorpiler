import { Guard } from "./Guard.js";
import { Message } from "./Message.js";
import { Participant } from "./Participant.js";

export class Label {
  constructor(
    public type: LabelType,
    public guard?: Guard | null,
  ) {}
}

export class EventLabel extends Label {
  constructor(
    public sender: Participant,
    public receiver: Participant[],
    public name: string,
    public modelID: string,
    labelType: LabelType,
  ) {
    super(labelType);
  }
}

export class TaskLabel extends EventLabel {
  constructor(
    sender: Participant,
    receiver: Participant[],
    name: string,
    modelID: string,
    public taskType: TaskType = TaskType.Task,
    public message: Message | null = null,
  ) {
    super(sender, receiver, name, modelID, LabelType.Task);
  }
}

export enum TaskType {
  Task,
  SubChoreography,
  CallChoreography,
}

export class CallLabel extends Label {
  constructor(
    public name: string,
    public targetID: string,
    public taskType: TaskType = TaskType.CallChoreography,
  ) {
    super(LabelType.CallChoreography);
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
  ParallelConverging,
  ParallelDiverging,
  EventExclusiveIncoming,
  EventExclusiveOutgoing,
  SubChoreography,
  CallChoreography,
}
