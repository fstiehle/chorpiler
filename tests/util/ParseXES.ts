import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { EventLog, Event } from './EventLog';
import assert from 'assert';

export interface IXESParser {
  fromXML(xml: Buffer): Promise<EventLog>;
}

enum Props {
  key = '@_key',
  val = '@_value'
}

export class XESFastXMLParser {
  private parser = new XMLParser({ 
    ignoreAttributes: false,
    isArray: (_, __, ___, isAttribute) => { 
      return !isAttribute;
    }
  });

  fromXML(xml: Buffer) {
    return new Promise<EventLog>((resolve, reject) => {
      try {
        const parsed = this.parser.parse(xml.toString());
        const log = parsed['log'];
        const events = new Array<Event>();

        if (log.length > 1) {
          console.warn("More than one log, others are ignored...")
        }

        for (const trace of log[0]['trace']) {
          for (const event of trace['event']) {
            let name = null;
            let from = null;
            let to = null;

            for (const stringEntry of event['string']) {

              if (stringEntry[Props.key] ===  'concept:name') {
                name = stringEntry[Props.val];
                continue;
              }
              if (stringEntry[Props.key] ===  'sourceRef') {
                from = stringEntry[Props.val];
                continue;
              }
              if (stringEntry[Props.key] ===  'targetRef') {
                to = stringEntry[Props.val];
                continue;
              }
              
            }

            assert(name && from && to);
            events.push(new Event(name, from, to));
          }

        }

        return resolve(new EventLog(events));
      } catch (error) {
        return reject(error);
      }
    })
  }

  /* fromXML(xml: Buffer): Promise<EventLog> {
    return new Promise<EventLog>((resolve, reject) => {
      const parsed = this.parser.parse(xml.toString());
      const rootElements = parsed[Elements.rootElements][0];
      if (!(Elements.choreographies in rootElements)) {
        return reject("No choreography found");
      }
      if (rootElements[Elements.choreographies].length !== 1) {
        // we don't support call choreographies yet.
        console.warn("Warning: More than one choreography found, others are ignored.")
      }
      const choreography = rootElements[Elements.choreographies][0];
      // TODO: verify there is no element we don't support

      const iNetTranslator = new INetFastXMLParser.INetTranslator();
      try {
        const iNet = iNetTranslator.translate(choreography);
        return resolve(iNet);
      } catch (error) {
        return reject(error);
      }
    })
  } */
}