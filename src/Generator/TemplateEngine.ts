import Mustache from "mustache";
import { InteractionNet } from "../Parser/InteractionNet";
import { ProcessEncoder } from "./ProcessEncoder";
import { ProcessEncoding } from './ProcessEncoding';
import util from 'util';
import * as fs from 'fs';

const readFile = util.promisify(fs.readFile);

export interface ITemplateEngine {
  addCaseVariable(variableName: string, expression: string): void;
  deleteCaseVariable(variableName: string): boolean;
  getCaseVariable(variableName: string): string | undefined;
  compile(): Promise<{target: string, encoding: ProcessEncoding}>
  setTemplatePath(path: string): void;
  getTemplate(): Promise<string>
}

export abstract class TemplateEngine implements ITemplateEngine {
  caseVariables: Map<string, string> = new Map();

  constructor(
    private iNet: InteractionNet, 
    private templatePath: string, 
    _caseVariables?: Map<string, string>) {
      
      if (_caseVariables != null)
        this.caseVariables = _caseVariables;
  }

  async compile(): Promise<{target: string, encoding: ProcessEncoding}> {
    if (this.iNet.initial == null || this.iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    const iNet: InteractionNet = {...this.iNet}; // TODO deep copy: why?
    const template: string = await this.getTemplate();
  
    const gen = ProcessEncoder.generate(iNet);
    gen.options.caseVariables = [...this.caseVariables.values()];

    return { target: Mustache.render(template, gen.options), 
      encoding: gen.encoding };
  }

  addCaseVariable(variableName: string, expression: string) {
    this.caseVariables.set(variableName, expression);
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