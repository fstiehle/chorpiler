import SolDefaultContractGenerator from './Generator/target/Sol/DefaultGenerator';
import SolStateChannelContractGenerator from './Generator/target/Sol/StateChannelGenerator';
import TSDefaultFuncGenerator from './Generator/target/Typescript/DefaultFuncGenerator';
import { INetFastXMLParser } from './Parser/FastXMLParser';
import { EventLog, Event } from './util/EventLog/EventLog';
import { Trace } from './util/EventLog/Trace';
import { XESFastXMLParser } from './util/EventLog/XESFastXMLParser';

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

export * from './Generator/Encoding/TriggerEncoding';
export * from './Generator/Encoder'
export * from './Generator/TemplateEngine'

export * from './Parser/Element'
export * from './Parser/InteractionNet'
export * from './Parser/Parser'
export * from './Parser/InteractionNet'

export * from './util/EventLog/XESParser'