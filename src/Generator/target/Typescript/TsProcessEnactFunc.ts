import Mustache from "mustache";
import InteractionNet from "../../../Parser/InteractionNet"
import TemplateEngine from "../../TemplateEngine"
import util from 'util';
import * as fs from 'fs';
import path from "path";
import ProcessGenerator from "../../ProcessGenerator";
import { ProcessEncoding } from '../../ProcessEncoding';

const readFile = util.promisify(fs.readFile);

export default class TypeScriptEnactFunc implements TemplateEngine {
  async compile(_iNet: InteractionNet, _template?: string , _options?: any): Promise<{target: string, encoding: ProcessEncoding}> {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }

    const template = _template ? _template : await this.getTemplate();

    const gen = ProcessGenerator.generate(iNet, _options);
    
    return { target: Mustache.render(template, gen.options), 
      encoding: ProcessGenerator.encoding(gen.taskIDs, gen.conditionIDs, gen.participants) };
  }

  async getTemplate(): Promise<string> {
    const f = await readFile(path.join(__dirname, '..', '..', 'templates/ProcessEnactFunc.ts'));
    return f.toString();
  }
}