import InteractionNet from "../Parser/InteractionNet";

export default interface TemplateEngine {
  compile(iNet: InteractionNet, template?: string, option?: any): Promise<string>
  getTemplate(): Promise<string>
}