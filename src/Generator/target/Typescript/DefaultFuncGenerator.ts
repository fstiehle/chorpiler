import { InteractionNet } from "../../../Parser/InteractionNet"
import { CaseVariable } from "../../Encoding/Encoding";
import { TemplateEngine } from "../../TemplateEngine"
import path from "path";

export default class TSDefaultFuncGenerator extends TemplateEngine {

  constructor(
    _iNet: InteractionNet, 
    _caseVariables?: Map<string, CaseVariable>) {
    super(_iNet, path.join(__dirname, '..', '..', 'templates/enact.ts'), _caseVariables);
  }
}