import { Message } from "../../../Parser/Elements/Message.js";
import { Transition } from "./Transition.js";
import { TransitionTarget } from "./TransitionTarget.js";

export class TaskWithCaseVar {
  public produce: string;
  public taskID: string | null;
  public modelID: string;
  public initiator: string;
  public taskName: string;
  public decision: string;
  public isEnd: boolean;
  public outTo: TransitionTarget | null;
  public inFrom: TransitionTarget | null;
  public isCall: boolean;
  public isSub: boolean;
  public isInstanced: boolean;
  public message: Message | null;
  public conditionParts: string[];
  public conditionString: string;

  constructor(
    public consume: string,
    public transition: Transition,
    message: Message | null = null,
  ) {
    this.produce = transition.produce;
    this.taskID = null; // No check on taskID as specified
    this.modelID = transition.modelID;
    this.initiator = transition.initiator;
    this.taskName = transition.taskName;
    this.decision = transition.decision;
    this.isInstanced = transition.isInstanced;
    this.isEnd = transition.isEnd;
    this.outTo = transition.outTo;
    this.inFrom = transition.inFrom;
    this.isCall = transition.isCall;
    this.isSub = transition.isSub;
    this.message = message;

    this.conditionParts = [];

    if (this.inFrom && this.inFrom.isSub) {
      const tokenStateRef = this.isInstanced
        ? `processData[instanceID].tokenState[${this.inFrom.call.id}]`
        : `tokenState[${this.inFrom.call.id}]`;
      this.conditionParts.push(
        `require(0 == ${tokenStateRef}, "SubChoreography not completed");`,
      );
    }

    if (this.initiator) {
      const participantsRef = this.isInstanced
        ? `processData[instanceID].participants[${this.initiator}]`
        : `participants[${this.initiator}]`;
      this.conditionParts.push(
        `require(msg.sender == ${participantsRef}, "Invalid initiator");`,
      );
    }

    if (this.inFrom && this.inFrom.isCall) {
      this.conditionParts.push(
        `require(0 == ${this.inFrom.call.name}.getTokenState(instanceList[${this.inFrom.call.id}]), "Called choreography not completed");`,
      );
    }

    if (this.decision) {
      this.conditionParts.push(
        `require(${this.decision}, "Decision condition not met");`,
      );
    }

    this.conditionString = this.conditionParts.join("\n");
  }
}