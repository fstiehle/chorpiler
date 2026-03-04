export class Call {
  constructor(
    public type: CallType,
    public targetID: string,
    public participantsMapping: Map<string, string> | null,
  ) {}
}

export enum CallType {
  SubChoreography,
  CallChoreography,
}
