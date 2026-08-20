import { SolDefaultContractGenerator } from "./Generator/target/Sol/DefaultGenerator.js";
import { SolChannelContractGenerator } from "./Generator/target/Sol/ChannelGenerator.js";
import { INetFastXMLParser } from "./Parser/FastXMLParser.js";
import { Simulator } from "./Simulator/Simulator.js";
import { EventLog, Event } from "./util/EventLog/EventLog.js";
import { Trace } from "./util/EventLog/Trace.js";
import { XESFastXMLParser } from "./util/EventLog/XESFastXMLParser.js";

// Named re-exports (tree-shakable)
export { INetFastXMLParser as Parser } from "./Parser/FastXMLParser.js";
export * from "./Parser/InteractionNet.js";
export * from "./Parser/Parser.js";
export * from "./Generator/Encoding/JSON/TriggerEncoding.js";
export * from "./Generator/Encoding/Encoder.js";
export * from "./Generator/Encoding/Encoding.js";
export * from "./Generator/TemplateEngine.js";
export * from "./util/EventLog/XESParser.js";
export * from "./util/encodingUtils.js";
export * from "./Generator/target/Sol/DefaultGenerator.js";
export * from "./Generator/target/Sol/ChannelGenerator.js";
export * from "./Simulator/Simulator.js";
export * from "./util/EventLog/EventLog.js";
export * from "./util/EventLog/Trace.js";
export * from "./util/EventLog/XESFastXMLParser.js";

// Default aggregated export for convenience/backwards-compat
const chorpiler = {
  Parser: INetFastXMLParser,
  generators: {
    sol: {
      DefaultContractGenerator: SolDefaultContractGenerator,
      ChannelContractGenerator: SolChannelContractGenerator,
    },
  },
  utils: {
    Simulator,
    EventLog,
    Trace,
    Event,
    XESParser: XESFastXMLParser,
  },
};

export default chorpiler;
