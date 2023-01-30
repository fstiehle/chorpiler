import InteractionNet from "../Parser/InteractionNet";

export interface TemplateEngine {
  compile(iNet: InteractionNet, template?: string, option?: any): Promise<string>
  getTemplate(): Promise<string>
}