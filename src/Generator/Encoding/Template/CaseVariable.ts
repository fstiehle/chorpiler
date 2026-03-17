import { capitalize } from "../../../util/helpers.js";

/**
 * Represents a case variable that can be used in the generated contract.
 * Automatically assembles validation conditions from the linked message's transition,
 * following the same pattern as the Transition class but generating require statements
 * for Solidity contract validation.
 */
export class CaseVariable {
  public functionName: string;

  constructor(
    public name: string,
    public type: string,
    public expression: string,
    public setters: boolean,
  ) {
    this.functionName = "set" + capitalize(name);
  }
}