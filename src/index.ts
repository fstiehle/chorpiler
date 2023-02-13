import { SolidityProcess } from './Generator/Sol/ProcessContract';
import { SolidityStateChannelRoot } from './Generator/Sol/StateChannelRoot';
import { INetFastXMLParser } from './Parser/Parser';

export default {
  Parser: INetFastXMLParser,
  Generator: {
    Sol: {
      ProcessContract: SolidityProcess,
      StateChannelRoot: SolidityStateChannelRoot
    }
  }
}