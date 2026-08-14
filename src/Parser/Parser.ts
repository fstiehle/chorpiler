import { InteractionNet } from "./InteractionNet.js";

export interface INetParser {
  fromXML(xml: Buffer): Promise<InteractionNet[]>;
}
