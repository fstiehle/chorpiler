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
    public expression: string,
    public setters: boolean,
    public functionName: string,
    public type: string,
  ) {}

  /**
   * Creates a CaseVariable instance from an Encoding.CaseVariable.
   */
  static fromEncoding(cv: Encoding.CaseVariable, isInstanced: boolean): CaseVariable {
    // Strip trailing whitespace and ensure semicolon at the end
    let expression = cv.expression.trimEnd();
    if (!expression.endsWith(";")) {
      expression += ";";
    }

    return new CaseVariable(
      cv.name,
      isInstanced,
      expression,
      cv.setters,
      "set" + capitalize(cv.name),
      cv.type
    );
  }
}