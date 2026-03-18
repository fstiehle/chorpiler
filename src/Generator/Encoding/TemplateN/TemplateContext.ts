import { Options } from "./Options.js";

/**
 * Shared context properties passed to TemplateN classes during conversion.
 * Used to avoid parameter repetition in fromEncoding factory methods.
 */
export interface TemplateContext {
  /** Compile options (debug, events) */
  options: Options;

  /** Whether the process supports instances */
  isInstanced: boolean;

  /** Whether the contract has sub-processes */
  hasSubProcesses: boolean;

  /** Process identifier (numeric) */
  id: string;

  /** Process model identifier (name) */
  modelID: string;
}