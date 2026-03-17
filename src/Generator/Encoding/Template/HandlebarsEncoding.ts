import * as Encoding from "../Encoding.js";
import { IFromEncoding } from "../IFromEncoding.js";
import { CompileOptions } from "../../TemplateEngine.js";
import { HandlebarsProcessEncoding } from "./HandlebarsProcessEncoding.js";

export class HandlebarsEncoding
  extends HandlebarsProcessEncoding
  implements IFromEncoding
{
  /**
   * Converts an `Encoding.Process` object to a Handlebars template-ready object.
   *
   * @param encoding - The `Encoding.Process` object to convert.
   * @returns A new `HandlebarsEncoding` object.
   */

  constructor(
    public options: CompileOptions,
    public isCalled: boolean = false,
    public isInstanced: boolean = false,
    public subProcesses: HandlebarsProcessEncoding[] = [],
    ...args: ConstructorParameters<typeof HandlebarsProcessEncoding>
  ) {
    super(...args);
  }

  get hasSubProcesses(): boolean {
    return this.subProcesses.length > 0;
  }
  get numberOfProcesses(): string {
    return (this.subProcesses.length + 1).toString();
  }

  static fromEncoding(encoding: Encoding.MainProcess): HandlebarsEncoding {
    const main = HandlebarsProcessEncoding.fromEncoding(
      encoding,
      encoding.options,
      encoding.isInstanced,
    );
    const subProcesses = Array.from(encoding.subProcesses.values()).map(
      (subProcess) =>
        HandlebarsProcessEncoding.fromEncoding(
          subProcess,
          encoding.options,
          encoding.isInstanced,
        ),
    );

    return new HandlebarsEncoding(
      encoding.options,
      encoding.isCalled,
      encoding.isInstanced,
      subProcesses,
      main.id,
      main.modelID,
      main.participants,
      main.callList,
      main.caseVariables,
      main.states,
      main.taskWithCaseVar,
    );
  }
}