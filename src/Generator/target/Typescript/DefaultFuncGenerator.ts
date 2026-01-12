import { InteractionNet } from "../../../Parser/InteractionNet.js";
import { CaseVariable } from "../../Encoding/Encoding.js";
import { TemplateEngine } from "../../TemplateEngine.js";
import path from "path";

export default class TSDefaultFuncGenerator extends TemplateEngine {
  constructor(
    _iNet: InteractionNet,
    _caseVariables?: Map<string, CaseVariable>,
  ) {
    super(
      _iNet,
      path.join(__dirname, "..", "..", "templates/enact.ts"),
      _caseVariables,
    );
  }
}
