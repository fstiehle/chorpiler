import Mustache from "mustache";
import { InteractionNet } from "../Parser/InteractionNet.js";
import util from "util";
import * as fs from "fs";
import { CaseVariable } from "./Encoding/Encoding.js";
import { INetEncoder } from "./Encoder.js";
import { MustacheEncoding } from "./Encoding/MustacheEncoding.js";
import { TriggerEncoding } from "./Encoding/TriggerEncoding.js";

const readFile = util.promisify(fs.readFile);

export interface CompileOptions {
  unfoldSubNets: boolean; // If true, sub choreographies are "folded" into the main choreography, i.e.,
  // they are treated as visual option only with no consequence for the generated contract
  loopProtection: boolean; // adds a NOOP operation (ID=0), which is necessary to process looping behaviour, should be set to true.
  events: boolean; // emit Events on task execution
  debug: boolean; // add Hardhat's console.log debug info
}

export interface ITemplateEngine {
  addCaseVariable(variable: CaseVariable): void;
  deleteCaseVariable(variableName: string): boolean;
  getCaseVariable(variableName: string): CaseVariable | undefined;
  compile(options?: {
    unfoldSubNets?: boolean;
    loopProtection?: boolean;
    events?: boolean;
    debug?: boolean;
  }): Promise<{ target: string; encoding: TriggerEncoding }>;
  setTemplatePath(path: string): void;
  getTemplate(): Promise<string>;
}

export abstract class TemplateEngine implements ITemplateEngine {
  constructor(
    public iNet: InteractionNet,
    private templatePath: string,
    private caseVariables = new Map<string, CaseVariable>(),
    private templatePartials = new Array<{ partial: string; path: string }>(),
    private isInstanced: boolean = false,
  ) {}

  async compile(_options?: {
    unfoldSubNets?: boolean;
    loopProtection?: boolean;
    events?: boolean;
    debug?: boolean;
  }) {
    const options = {
      unfoldSubNets: _options?.unfoldSubNets ?? false,
      loopProtection: _options?.loopProtection ?? true,
      events: _options?.events ?? false,
      debug: _options?.debug ?? false,
    };
    if (this.iNet.initial == null || this.iNet.end == null) {
      throw new Error("Invalid InteractionNet");
    }
    const iNet: InteractionNet = { ...this.iNet }; // Deep copy: why?
    const template: string = await this.getTemplate();
    const partials = this.templatePartials.reduce(
      (acc: Record<string, string>, partial) => {
        acc[partial.partial] = fs.readFileSync(partial.path).toString();
        return acc;
      },
      {},
    );

    const encoder = new INetEncoder();
    const gen = encoder.generate(iNet, options, this.isInstanced);
    gen.caseVariables = this.caseVariables;

    return {
      target: Mustache.render(
        template,
        MustacheEncoding.fromEncoding(gen),
        partials,
      ),
      encoding: TriggerEncoding.fromEncoding(gen),
    };
  }

  addCaseVariable(variable: CaseVariable) {
    this.caseVariables.set(variable.name, variable);
  }
  deleteCaseVariable(variableName: string) {
    return this.caseVariables.delete(variableName);
  }
  getCaseVariable(variableName: string) {
    return this.caseVariables.get(variableName);
  }
  setTemplatePath(path: string): void {
    this.templatePath = path;
  }
  async getTemplate(): Promise<string> {
    return (await readFile(this.templatePath)).toString();
  }
}
