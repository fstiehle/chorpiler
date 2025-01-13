import { InteractionNet } from "../../../Parser/InteractionNet"
import { TemplateEngine } from "../../TemplateEngine"
import path from "path";

export default class SolDefaultContractGenerator extends TemplateEngine {

  constructor(
    _iNet: InteractionNet, 
    _caseVariables?: Map<string, string>) {
    super(_iNet, path.join(__dirname, '..', '..', 'templates/ProcessExecution.sol'), _caseVariables);
  }
}