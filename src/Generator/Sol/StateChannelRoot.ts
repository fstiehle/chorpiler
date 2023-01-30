import Mustache from "mustache";
import InteractionNet from "../../Parser/InteractionNet"
import { TemplateEngine } from "../TemplateEngine"

const CONFORMANCE_CONTRACT_LOCATION = "./Conformance.sol";

type SolidtiyContractTemplate = {
  conformanceContractLocation: string;
  numberOfParticipants: string
}

export class SolidityStateChannelRoot implements TemplateEngine {
  compile(iNet: InteractionNet, template: string, _options?: SolidtiyContractTemplate): string {
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    
    const options: SolidtiyContractTemplate = _options ? _options : {
      numberOfParticipants: "",
      conformanceContractLocation: CONFORMANCE_CONTRACT_LOCATION
    }

    options.numberOfParticipants = iNet.participants.size.toString();
    return Mustache.render(template, options);
  }
}