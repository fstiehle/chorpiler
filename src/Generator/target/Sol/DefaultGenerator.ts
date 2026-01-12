import { InteractionNet } from "../../../Parser/InteractionNet.js";
import { CaseVariable } from "../../Encoding/Encoding.js";
import { TemplateEngine } from "../../TemplateEngine.js";
import path from "path";

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
