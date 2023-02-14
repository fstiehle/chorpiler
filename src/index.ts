import SolidityEnactment from './Generator/target/Sol/ProcessEnactment';
import { SolidityStateChannelRoot } from './Generator/target/Sol/StateChannelRoot';
import TypeScriptEnactment from './Generator/target/Typescript/ProcessEnactment';
import { INetFastXMLParser } from './Parser/Parser';

export default {
  Parser: INetFastXMLParser,
  Generator: {
    Sol: {
      Enactment: SolidityEnactment,
      StateChannelRoot: SolidityStateChannelRoot
    },
    TS: {
      Enactment: TypeScriptEnactment
    }
  }
}