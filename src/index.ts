import SolDefaultContractGenerator from './Generator/target/Sol/DefaultContractGenerator';
import SolStateChannelContractGenerator from './Generator/target/Sol/StateChannelContractGenerator';
import TypeScriptGenerator from './Generator/target/Typescript/DefaultFuncGenerator';
import { INetFastXMLParser } from './Parser/FastXMLParser';
import { EventLog, Trace, Event } from './util/EventLog';
import { XESFastXMLParser } from './util/XESFastXMLParser';

export default {
  Parser: INetFastXMLParser,
  generators: {
    sol: {
      DefaultContractGenerator: SolDefaultContractGenerator,
      StateChannelContractGenerator: SolStateChannelContractGenerator
    },
    ts: {
       DefaultFunctionGenerator: TypeScriptGenerator
    }
  },
  utils: {
    EventLog,
    Trace,
    Event,
    XESParser: XESFastXMLParser
  }
}

export * from './Generator/ProcessEncoding';
export * from './Generator/ProcessGenerator'
export * from './Generator/TemplateEngine'

export * from './Parser/Element'
export * from './Parser/InteractionNet'
export * from './Parser/Parser'
export * from './Parser/InteractionNet'

export * from './util/XESParser'