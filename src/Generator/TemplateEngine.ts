import { InteractionNet } from "../Parser/InteractionNet";
import { ProcessEncoding } from './ProcessEncoding';

export interface TemplateEngine {
  compile(iNet: InteractionNet, template?: string): Promise<{target: string, encoding: ProcessEncoding}>
  getTemplate(): Promise<string>
}