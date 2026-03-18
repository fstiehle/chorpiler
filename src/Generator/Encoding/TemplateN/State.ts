import type * as Encoding from "../Encoding.js";
import { Transition } from "./Transition.js";
import { Options } from "./Options.js";

/**
 * Represents a state in the template encoding.
 * Used for rendering state checks and their associated transitions.
 *
 * Template expressions used from states.handlebars.sol:
 * - consume: token value to check for this state
 * - transitions: array of transitions that can fire from this state
 * - isDecision: whether this state contains decision logic (branching)
 *
 * Propagated properties (for nested partials):
 * - isInstanced: instance support (for tokenstate partial)
 * - hasSubProcesses: whether contract has sub-processes (for tokenstate partial)
 * - id: process identifier (for tokenstate partial)
 * - modelID: process name (for debug logging)
 */
export class State {
  constructor(
    public consume: string,
    public transitions: Transition[],
    public isDecision: boolean,
    public isInstanced: boolean,
    public hasSubProcesses: boolean,
    public id: string,
    public modelID: string,
  ) {}

  /**
   * Creates a State instance from an encoding state (consume token + transitions).
   */
  static fromEncoding(
    consume: number,
    transitions: Encoding.Transition[],
    excludeTransitions: Set<Encoding.Transition>,
    isInstanced: boolean,
    options: Options,
    hasSubProcesses: boolean,
    id: string,
    modelID: string
  ): State {
    // Filter out transitions that are already in taskWithCaseVar
    const filteredTransitions = transitions.filter(t => !excludeTransitions.has(t));

    // Convert transitions
    const convertedTransitions = filteredTransitions.map(t =>
      Transition.fromEncoding(t, isInstanced, options)
    );

    // Sort transitions so defaultBranch is last
    convertedTransitions.sort((a, b) => {
      if (a.defaultBranch && !b.defaultBranch) return 1;
      if (!a.defaultBranch && b.defaultBranch) return -1;
      return 0;
    });

    // Check if this is a decision state (has decision conditions)
    const hasDecisions = filteredTransitions.some(t => t.condition);
    const hasDefaultBranch = filteredTransitions.some(t => t.defaultBranch);

    return new State(
      consume.toString(),
      convertedTransitions,
      hasDecisions && hasDefaultBranch,
      isInstanced,
      hasSubProcesses,
      id,
      modelID
    );
  }
}