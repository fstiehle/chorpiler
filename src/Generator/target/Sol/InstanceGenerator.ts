import { InteractionNet } from "../../../Parser/InteractionNet.js";
import { CaseVariable } from "../../Encoding/Encoding.js";
import { TemplateEngine } from "../../TemplateEngine.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class SolInstanceGenerator extends TemplateEngine {
  constructor(
    _iNet: InteractionNet,
    _caseVariables?: Map<string, CaseVariable>,
  ) {
    super(
      _iNet,
      path.join(__dirname, "..", "..", "templates/InstanceExecution.sol"),
      _caseVariables,
      [], // partials will be auto-discovered
      true, // isInstanced = true
    );
  }
}
