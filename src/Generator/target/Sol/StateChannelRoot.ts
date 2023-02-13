import Mustache from "mustache";
import InteractionNet from "../../../Parser/InteractionNet"
import TemplateEngine from "../../TemplateEngine"
import util from 'util';
import * as fs from 'fs';
import path from "path";

const readFile = util.promisify(fs.readFile);

const CONFORMANCE_CONTRACT_LOCATION = "./Conformance.sol";

type Options = {
  conformanceContractLocation: string;
  numberOfParticipants: string
}

export class SolidityStateChannelRoot implements TemplateEngine {

  async getTemplate(): Promise<string> {
    return (await readFile(path.join(__dirname, '..', '..', 'templates/StateChannelRoot.sol'))).toString();
  }

  async compile(iNet: InteractionNet, _template?: string, _options?: Options): Promise<string> {
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    const template: string = _template ? _template : await this.getTemplate();
    
    const options: Options = _options ? _options : {
      numberOfParticipants: "",
      conformanceContractLocation: CONFORMANCE_CONTRACT_LOCATION
    }

    options.numberOfParticipants = iNet.participants.size.toString();
    return Mustache.render(template, options);
  }
}