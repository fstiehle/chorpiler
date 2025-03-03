import SolDefaultContractGenerator from './Generator/target/Sol/DefaultContractGenerator';
import SolStateChannelContractGenerator from './Generator/target/Sol/StateChannelContractGenerator';
import TSDefaultFuncGenerator from './Generator/target/Typescript/DefaultFuncGenerator';
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
       DefaultFunctionGenerator: TSDefaultFuncGenerator
    }
  },
  utils: {
    EventLog,
    Trace,
    Event,
    XESParser: XESFastXMLParser
  }
}

export * from './Generator/Encodings/TriggerEncoding';
export * from './Generator/Encoder'
export * from './Generator/TemplateEngine'

export * from './Parser/Element'
export * from './Parser/InteractionNet'
export * from './Parser/Parser'
export * from './Parser/InteractionNet'

export * from './util/XESParser'