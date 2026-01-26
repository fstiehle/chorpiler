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
    _caseVariables?: Map<string, CaseVariable>,
  ) {
    super(
      _iNet,
      path.join(__dirname, "..", "..", "templates/ProcessExecution.sol"),
      _caseVariables,
      [
        {
          partial: "conditionalTransition",
          path: path.join(
            __dirname,
            "..",
            "..",
            "templates/partials/conditionalTransition.mustache.sol",
          ),
        },
        {
          partial: "transition",
          path: path.join(
            __dirname,
            "..",
            "..",
            "templates/partials/transition.mustache.sol",
          ),
        },
        {
          partial: "condition",
          path: path.join(
            __dirname,
            "..",
            "..",
            "templates/partials/condition.mustache.sol",
          ),
        },
        {
          partial: "execution",
          path: path.join(
            __dirname,
            "..",
            "..",
            "templates/partials/execution.mustache.sol",
          ),
        },
      ],
    );
  }
}
