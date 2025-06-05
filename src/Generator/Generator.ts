import { InteractionNet } from "../Parser/InteractionNet";
import { CaseVariable } from "./Encoding/Encoding";
import { TemplateEngine } from "./TemplateEngine";

export interface GeneratorConstructor {
  new(_iNet: InteractionNet, _caseVariables?: Map<string, CaseVariable>): TemplateEngine;
}