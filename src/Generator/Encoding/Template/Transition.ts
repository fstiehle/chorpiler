import { CompileOptions } from "../../TemplateEngine.js";
import { TransitionTarget } from "./TransitionTarget.js";

// Handlebars doesn't render the number 0 (falsy value), so we need to use strings
export class Transition {
  public conditions: any = [];
  public conditionString: string = "";

  constructor(
    public options: CompileOptions,
    public consume: string,
    public produce: string,
    public taskID: string,
    public modelID: string, // ID as was found in model
    public initiator: string,
    public taskName: string,
    public decision: string,
    public isEnd: boolean,
    public defaultBranch: boolean,
    public outTo: TransitionTarget | null,
    public inFrom: TransitionTarget | null,
    public isCall: boolean,
    public isSub: boolean,
    public isInstanced: boolean,
  ) {
    const conditionParts: string[] = [];

    if (this.taskID) {
      conditionParts.push(`${this.taskID} == id`);
      this.conditions.push({ content: this.taskID, hasID: true, last: false });
    }
    if (this.inFrom && this.inFrom.isSub) {
      const tokenStateRef = this.isInstanced
        ? `processData[instanceID].tokenState[${this.inFrom.call.id}]`
        : `tokenState[${this.inFrom.call.id}]`;
      conditionParts.push(`0 == ${tokenStateRef}`);
      this.conditions.push({
        content: this.inFrom.call.id.toString(),
        hasInFrom: true,
        last: false,
      });
    }

    if (this.initiator) {
      const participantsRef = this.isInstanced
        ? `processData[instanceID].participants[${this.initiator}]`
        : `participants[${this.initiator}]`;
      conditionParts.push(`msg.sender == ${participantsRef}`);
      this.conditions.push({
        content: this.initiator,
        hasInitiator: true,
        last: false,
      });
    }

    if (this.inFrom && this.inFrom.isCall) {
      conditionParts.push(
        `0 == ${this.inFrom.call.name}.getTokenState(instanceList[${this.inFrom.call.id}])`,
      );
      this.conditions.push({
        content: this.inFrom.call.id.toString(),
        hasInFrom: true,
        last: false,
      });
    }

    this.conditionString = conditionParts.join(" && ");

    if (this.conditions.length > 0) {
      this.conditions[this.conditions.length - 1].last = true;
    }
  }

  get hasConditions(): boolean {
    return this.conditions.length > 0;
  }
}