/**
 * TemplateN Module
 *
 * This module provides classes for representing Handlebars template data structures.
 * Each class corresponds to template expressions and partials used in Contract.handlebars.sol
 * and its associated partials in the partialsN folder.
 *
 * Main exports:
 * - Contract: Main template data structure
 * - Options: Compile options (debug, events)
 * - Call: Called contract interface
 * - CaseVariable: Case variable declaration
 * - TaskWithCaseVar: Task that sets a case variable
 * - State: Process state with transitions
 * - Transition: State transition
 * - SubProcess: Sub-process definition
 * - OutTo: Transition target (call/sub-choreography)
 */

export { HandlebarsEncoding } from "./HandlebarsEncoding.js";
export { Contract } from "./Contract.js";
export { Options } from "./Options.js";
export { Call } from "./Call.js";
export { CaseVariable } from "./CaseVariable.js";
export { TaskWithCaseVar } from "./TaskWithCaseVar.js";
export { State } from "./State.js";
export { Transition } from "./Transition.js";
export { SubProcess } from "./SubProcess.js";
export { OutTo } from "./OutTo.js";
export type { TemplateContext } from "./TemplateContext.js";