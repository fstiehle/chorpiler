import { EventLog } from "./EventLog";

export interface IXESParser {
  fromXML(xml: Buffer): Promise<EventLog>;
}