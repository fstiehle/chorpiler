import * as Encoding from "../Encoding.js";
import { IFromEncoding } from "../IFromEncoding.js";
import { Contract } from "./Types/Contract.js";
import { Options } from "./Types/Options.js";
import { Call } from "./Types/Call.js";
import { CaseVariable } from "./Types/CaseVariable.js";
import { DataTask } from "./Types/DataTask.js";
import { State } from "./Types/State.js";
import { SubProcess } from "./Types/SubProcess.js";

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

    // Get transitions with messages referencing case variables
    const dataTasks: DataTask[] = [];
    const transitionsWithCaseVar = new Set<Encoding.Transition>();

    // Check main process states
    encoding.states.forEach((transitions) => {
      transitions.forEach((transition) => {
        if (transition instanceof Encoding.InitiatedTransition) {
          if (transition.message?.caseVariable) {
            transitionsWithCaseVar.add(transition);

            // Use DataTask.fromEncoding
            dataTasks.push(
              DataTask.fromEncoding(
                transition,
                encoding.isInstanced,
                options,
                encoding.subProcesses.size > 0,
                encoding.id.toString(),
                null
              )
            );
          }
        }
      });
    });

    // Also check subProcesses for transitions with case variables
    const subProcessesWithDataTasks = new Array<string>()
    encoding.subProcesses.forEach((subProcess) => {
      subProcess.states.forEach((transitions) => {
        transitions.forEach((transition) => {
          if (transition instanceof Encoding.InitiatedTransition) {
            if (transition.message?.caseVariable) {
              transitionsWithCaseVar.add(transition);
              subProcessesWithDataTasks.push(subProcess.modelID);
              // Use DataTask.fromEncoding
              dataTasks.push(
                DataTask.fromEncoding(
                  transition,
                  encoding.isInstanced,
                  options,
                  encoding.subProcesses.size > 0,
                  subProcess.id.toString(),
                  subProcess.modelID
                )
              );
            }
          }
        });
      });
    });

    // Convert main process states using State.fromEncoding
    const states = Array.from(encoding.states.entries()).map(([consume, transitions]) => {
      return State.fromEncoding(
        consume,
        transitions,
        new Set(),
        encoding.isInstanced,
        encoding.isChannel,
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
        encoding.isChannel,
        options,
        subProcessesWithDataTasks.includes(subProcess.modelID)
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
      dataTasks,
      states,
      subProcesses,
      encoding.isInstanced,
      encoding.isChannel,
      encoding.id.toString()
    );
  }
}