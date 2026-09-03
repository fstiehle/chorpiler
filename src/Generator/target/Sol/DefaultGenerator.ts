import { InteractionNet } from "../../../Parser/InteractionNet.js";
import { TemplateEngine } from "../../TemplateEngine.js";
import type { CompileOptions } from "../../TemplateEngine.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SolDefaultContractGenerator extends TemplateEngine {
  constructor(
    _iNet: InteractionNet,
    isInstanced = false,
    extraOptions: Partial<CompileOptions> | Record<string, any> = {},
  ) {
    super(
      _iNet,
      path.join(__dirname, "..", "..", "Encoding/Template", "Contract.handlebars.sol"),
      [], // partials will be auto-discovered
      isInstanced,
      false, // not a channel
      extraOptions,
    );
  }
}
