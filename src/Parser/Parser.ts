import InteractionNet from './InteractionNet';
import { XMLValidator } from 'fast-xml-parser';

export interface INetParser {
  fromXML(xml: Buffer): Promise<InteractionNet>;
}