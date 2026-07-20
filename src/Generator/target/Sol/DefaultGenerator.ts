import { InteractionNet } from "../../../Parser/InteractionNet.js";
import { CaseVariable } from "../../Encoding/Encoding.js";
import { TemplateEngine } from "../../TemplateEngine.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class SolDefaultContractGenerator extends TemplateEngine {
  constructor(
    _iNet: InteractionNet,
    isInstanced = false,
    _caseVariables?: Map<string, CaseVariable>,
  ) {
    super(
      _iNet,
      path.join(__dirname, "..", "..", "Encoding/Template/templates/Contract.handlebars.sol"),
      _caseVariables,
      [], // partials will be auto-discovered
      isInstanced
    );
  }
}
