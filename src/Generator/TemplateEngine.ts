import InteractionNet from "../Parser/InteractionNet";

export interface TemplateEngine {
  compile(iNet: InteractionNet, template: string): string
}