import SolidityEnactment from './Generator/target/Sol/ProcessEnactment.sol';
import { SolidityProcessChannel } from './Generator/target/Sol/ProcessChannel.sol';
import TypeScriptEnactment from './Generator/target/Typescript/ProcessEnactFunc.ts';
import { INetFastXMLParser } from './Parser/Parser';
import TemplateEngine from './Generator/TemplateEngine';
import ProcessGenerator from './Generator/ProcessGenerator';

export default {
  Parser: INetFastXMLParser,
  Generator: {
    ProcessGenerator: ProcessGenerator,
    Sol: {
      Enactment: SolidityEnactment,
      ProcessChannel: SolidityProcessChannel
    },
    TS: {
      Enactment: TypeScriptEnactment
    }
  }
}

export { TemplateEngine };