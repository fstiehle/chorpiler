import { InteractionNet } from "../../../Parser/InteractionNet.js";
import { CaseVariable } from "../../Encoding/Encoding.js";
import { TemplateEngine } from "../../TemplateEngine.js";
import type { CompileOptions } from "../../TemplateEngine.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SolChannelContractGenerator extends TemplateEngine {
  private extraOptions: Partial<CompileOptions> | Record<string, any>;

  constructor(
    _iNet: InteractionNet,
    _caseVariables?: Map<string, CaseVariable>,
    extraOptions: Partial<CompileOptions> | Record<string, any> = {},
  ) {
    super(
      _iNet,
      path.join(__dirname, "..", "..", "Encoding/Template", "ChannelResolver.handlebars.sol"),
      _caseVariables,
      [], // partials will be auto-discovered
      true, // channel always instanced
      true // is channel
    );
    this.extraOptions = extraOptions || {};
  }

  async compile(options?: Partial<CompileOptions>) {
    const merged = { ...(this.extraOptions as any), ...(options as any) };
    return super.compile(merged as any);
  }
}
