import * as Encoding from "../Encoding.js";
import { IFromEncoding } from "../IFromEncoding.js";
import { Contract } from "./Contract.js";
import { Options } from "./Options.js";
import { Call } from "./Call.js";
import { CaseVariable } from "./CaseVariable.js";
import { TaskWithCaseVar } from "./TaskWithCaseVar.js";
import { State } from "./State.js";
import { SubProcess } from "./SubProcess.js";

/**
 * HandlebarsEncoding converts internal Encoding.MainProcess to Contract template structure.
 * This is the main entry point for converting parsed choreography models into
 * Handlebars-ready data for Contract.handlebars.sol rendering.
 */
export class HandlebarsEncoding implements IFromEncoding {
  /**
   * Converts an Encoding.MainProcess to a Contract instance.
   *
   * @param encoding - The internal encoding from the parser/encoder
   * @returns Contract instance ready for Handlebars template rendering
   */
  static fromEncoding(encoding: Encoding.MainProcess): Contract {
    // Convert options
    const options = new Options(
      encoding.options.debug,
      encoding.options.events
    );

    // Convert calls using Call.fromEncoding
    const callList = Array.from(encoding.callList.values()).map(call =>
      Call.fromEncoding(call)
    );

    // Convert case variables using CaseVariable.fromEncoding
    const caseVariables = Array.from(encoding.caseVariables.values()).map(cv =>
      CaseVariable.fromEncoding(cv, encoding.isInstanced)
    );

    // Separate transitions with case variables from regular states
    const taskWithCaseVar: TaskWithCaseVar[] = [];
    const transitionsWithCaseVar = new Set<Encoding.Transition>();

    encoding.states.forEach((transitions) => {
      transitions.forEach((transition) => {
        if (transition instanceof Encoding.InitiatedTransition) {
          if (transition.message?.caseVariable) {
            transitionsWithCaseVar.add(transition);

            // Use TaskWithCaseVar.fromEncoding
            taskWithCaseVar.push(
              TaskWithCaseVar.fromEncoding(
                transition,
                encoding.isInstanced,
                options,
                encoding.subProcesses.size > 0,
                encoding.id.toString()
              )
            );
          }
        }
      });
    });

    // Convert main process states using State.fromEncoding
    const states = Array.from(encoding.states.entries()).map(([consume, transitions]) => {
      return State.fromEncoding(
        consume,
        transitions,
        transitionsWithCaseVar,
        encoding.isInstanced,
        options,
        encoding.subProcesses.size > 0,
        encoding.id.toString(),
        encoding.modelID
      );
    });

    // Convert sub-processes using SubProcess.fromEncoding
    const subProcesses = Array.from(encoding.subProcesses.values()).map(subProcess =>
      SubProcess.fromEncoding(
        subProcess,
        encoding.isInstanced,
        options
      )
    );

    // Create and return Contract
    return new Contract(
      options,
      encoding.modelID,
      encoding.participants.size.toString(),
      encoding.subProcesses.size > 0,
      encoding.callList.size > 0,
      encoding.callList.size.toString(),
      (encoding.subProcesses.size + 1).toString(),
      callList,
      caseVariables,
      taskWithCaseVar,
      states,
      subProcesses,
      encoding.isInstanced,
      encoding.id.toString()
    );
  }
}