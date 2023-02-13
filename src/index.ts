import SolidityEnactment from './Generator/target/Sol/Enactment';
import { SolidityStateChannelRoot } from './Generator/target/Sol/StateChannelRoot';
import TypeScriptEnactment from './Generator/target/Typescript/Enactment';
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