import { InteractionNet } from './InteractionNet';

export interface INetParser {
  fromXML(xml: Buffer): Promise<InteractionNet>;
}