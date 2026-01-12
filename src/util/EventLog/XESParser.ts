import { EventLog } from "./EventLog.js";

export interface IXESParser {
  fromXML(xml: Buffer): Promise<EventLog>;
}
