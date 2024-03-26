import InteractionNet from "../Parser/InteractionNet";
import { ProcessEncoding } from "./ProcessGenerator";

export default interface TemplateEngine {
  compile(iNet: InteractionNet, template?: string, option?: any): Promise<{target: string, encoding: ProcessEncoding}>
  getTemplate(): Promise<string>
}