import type * as Encoding from "../../Encoding.js";
import { buildInstanceStateRef } from "./varNames.js";

/**
 * Represents a decision expression in the template encoding.
 * Used for rendering decision conditions in transitions and data tasks.
 *
 * This class handles the transformation of decision strings to work with
 * instanced processes by prepending instanceData[instanceID].state. to case variable references.
 *
 * Template expressions:
 * - expression: the decision expression string (e.g., "amount > 100")
 */
export class Decision {
  constructor(
    public expression: string | null
  ) {}

  /**
   * Creates a Decision instance from a condition string and case variables.
   *
   * @param conditionString - The raw condition expression (e.g., "amount > 100")
   * @param caseVariables - Map of case variables in the process
   * @param isInstanced - Whether the process supports instances
   * @returns Decision instance with properly formatted expression
   */
  static fromEncoding(
    conditionString: string | null,
    caseVariables: Map<string, Encoding.CaseVariable>,
    isInstanced: boolean
  ): Decision {
    if (!conditionString) {
      return new Decision(null);
    }

    let expression = conditionString;

    // If instanced, prepend instanceData[instanceID]. to case variable references
    if (isInstanced && caseVariables.size > 0) {
      // Sort case variables by name length (longest first) to avoid partial replacements
      // e.g., if we have "amount" and "amountTotal", replace "amountTotal" first
      const sortedVariables = Array.from(caseVariables.keys())
        .sort((a, b) => b.length - a.length);

      for (const varName of sortedVariables) {
        // Create a regex that matches the variable name as a whole word
        // This prevents replacing parts of other identifiers
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        expression = expression.replace(regex, buildInstanceStateRef(varName));
      }
    }

    return new Decision(expression);
  }

  /**
   * Returns true if this condition has an expression.
   */
  hasExpression = (): boolean => this.expression !== null;

  /**
   * Returns the expression as a string, or empty string if null.
   */
  toString = (): string => this.expression ?? "";
}
