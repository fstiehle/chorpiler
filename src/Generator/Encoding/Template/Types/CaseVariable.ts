import type * as Encoding from "../../Encoding.js";
import { capitalize } from "../../../../util/helpers.js";

/**
 * Represents a case variable in the template encoding.
 * Used for rendering case variable declarations and setter functions.
 *
 * Template expressions used:
 * - name: variable name
 * - isInstanced: whether the process is instanced
 * - expression: initialization expression
 * - setters: whether to generate setter functions
 * - functionName: name of the setter function
 * - type: Solidity type of the variable
 *
 * Propagated properties (for nested partials):
 * - isInstanced: instance support (for variableassign partial)
 */
export class CaseVariable {
  constructor(
    public name: string,
    public isInstanced: boolean,
    public defaultValue: string,
    public setters: boolean,
    public functionName: string,
    public type: string,
    public visibility: string
  ) {}

  /**
   * Creates a CaseVariable instance from an Encoding.CaseVariable.
   */
  static fromEncoding(cv: Encoding.CaseVariable, isInstanced: boolean): CaseVariable {
    return new CaseVariable(
      cv.name,
      isInstanced,
      cv.defaultValue,
      cv.setters,
      "set" + capitalize(cv.name),
      cv.type,
      cv.visibility
    );
  }
}