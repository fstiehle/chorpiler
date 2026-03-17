import { assert } from "console";
import { CompileOptions } from "../../TemplateEngine.js";
import { Transition } from "./Transition.js";

export class State {
  constructor(
    public options: CompileOptions,
    public consume: string,
    public transitions: Transition[],
    public isDecision: boolean = false,
    public last: boolean | null = null,
  ) {
    const defaultBranches = this.transitions.filter((t) => t.defaultBranch);
    const decisions = this.transitions.filter((t) => t.decision);
    assert(defaultBranches.length <= 1);
    if (decisions.length > 0) {
      this.isDecision = true;
      this.transitions = [
        ...this.transitions.filter((t) => !t.defaultBranch),
        ...defaultBranches,
      ];
      if (transitions.length > 0 && defaultBranches.length === 1) {
        assert(
          transitions[transitions.length - 1].defaultBranch,
          "The last transition must be the defaultBranch.",
        );
      }
    }
  }
}