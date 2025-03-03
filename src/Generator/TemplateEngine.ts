import Mustache from "mustache";
import { InteractionNet } from "../Parser/InteractionNet";
import util from 'util';
import * as fs from 'fs';
import { CaseVariable, Process } from "./Encoding";
import { INetEncoder } from "./Encoder";
import { MustacheEncoding } from "./Encodings/MustacheEncoding";
import { TriggerEncoding } from "./Encodings/TriggerEncoding";

const readFile = util.promisify(fs.readFile);

export interface ITemplateEngine {
  addCaseVariable(variable: CaseVariable): void;
  deleteCaseVariable(variableName: string): boolean;
  getCaseVariable(variableName: string): CaseVariable | undefined;
  compile(): Promise<{target: string, encoding: TriggerEncoding}>
  setTemplatePath(path: string): void;
  getTemplate(): Promise<string>
}

export abstract class TemplateEngine implements ITemplateEngine {
  caseVariables: Map<string, CaseVariable> = new Map();

  constructor(
    private iNet: InteractionNet, 
    private templatePath: string, 
    _caseVariables?: Map<string, CaseVariable>) {
      
      if (_caseVariables != null)
        this.caseVariables = _caseVariables;
  }

  async compile() {
    if (this.iNet.initial == null || this.iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    const iNet: InteractionNet = {...this.iNet}; // Deep copy: why?
    const template: string = await this.getTemplate();

    const gen = INetEncoder.generate(iNet, { unfoldSubNets: true });
    gen.caseVariables = this.caseVariables;

    return { target: Mustache.render(template, MustacheEncoding.fromEncoding(gen)), 
      encoding: TriggerEncoding.fromEncoding(gen) }; 
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