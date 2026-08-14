import { InteractionNet } from "../Parser/InteractionNet.js";
import { CaseVariable } from "./Encoding/Encoding.js";
import { TemplateEngine } from "./TemplateEngine.js";

export interface GeneratorConstructor {
  new (
    _iNet: InteractionNet,
    _caseVariables?: Map<string, CaseVariable>,
  ): TemplateEngine;
}
