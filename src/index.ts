import SolDefaultContractGenerator from "./Generator/target/Sol/DefaultGenerator.js";
import SolStateChannelContractGenerator from "./Generator/target/Sol/StateChannelGenerator.js";
import { INetFastXMLParser } from "./Parser/FastXMLParser.js";
import { Simulator } from "./Simulator/Simulator.js";
import { EventLog, Event } from "./util/EventLog/EventLog.js";
import { Trace } from "./util/EventLog/Trace.js";
import { XESFastXMLParser } from "./util/EventLog/XESFastXMLParser.js";

export default {
  Parser: INetFastXMLParser,
  generators: {
    sol: {
      DefaultContractGenerator: SolDefaultContractGenerator,
      StateChannelContractGenerator: SolStateChannelContractGenerator,
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

export * from "./Generator/Encoding/TriggerEncoding.js";
export * from "./Generator/Encoder.js";
export * from "./Generator/TemplateEngine.js";

export * from "./Parser/Elements/Call.js";
export * from "./Parser/Elements/Element.js";
export * from "./Parser/Elements/Guard.js";
export * from "./Parser/Elements/Label.js";
export * from "./Parser/Elements/Message.js";
export * from "./Parser/Elements/Participant.js";
export * from "./Parser/Elements/Place.js";
export * from "./Parser/Elements/Transition.js";
export * from "./Parser/InteractionNet.js";

export * from "./Parser/InteractionNet.js";
export * from "./Parser/Parser.js";
export * from "./Parser/InteractionNet.js";

export * from "./util/EventLog/XESParser.js";
