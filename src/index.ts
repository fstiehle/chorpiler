import SolidityEnactment from './Generator/target/Sol/Enactment';
import { SolidityStateChannelRoot } from './Generator/target/Sol/StateChannelRoot';
import { INetFastXMLParser } from './Parser/Parser';

export default {
  Parser: INetFastXMLParser,
  Generator: {
    Sol: {
      ProcessContract: SolidityEnactment,
      StateChannelRoot: SolidityStateChannelRoot
    }
  }
}