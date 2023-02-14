import Mustache from "mustache";
import InteractionNet from "../../../Parser/InteractionNet"
import TemplateEngine from "../../TemplateEngine"
import util from 'util';
import * as fs from 'fs';
import path from "path";
import { ProcessEnactment } from "../../ProcessEnactment";

const readFile = util.promisify(fs.readFile);

export default class TypeScriptEnactment implements ProcessEnactment, TemplateEngine {
  async compile(_iNet: InteractionNet, _template?: string , _options?: any): Promise<string> {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }

  const template = _template ? _template : await this.getTemplate();

  const process = ProcessEnactment.generate(iNet, _options);
  return Mustache.render(template, process.options);
  }

  async getTemplate(): Promise<string> {
    const f = await readFile(path.join(__dirname, '..', '..', 'templates/Enactment.ts'));
    return f.toString();
  }
}