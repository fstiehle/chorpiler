import { InteractionNet } from "../Parser/InteractionNet.js";
import { TemplateEngine } from "./TemplateEngine.js";
import type { CompileOptions } from "./TemplateEngine.js";

export interface GeneratorConstructor {
  new (
    _iNet: InteractionNet,
    isInstanced?: boolean,
    extraOptions?: Partial<CompileOptions> | Record<string, any>,
  ): TemplateEngine;
}
