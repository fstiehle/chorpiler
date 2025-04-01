import { XMLParser } from 'fast-xml-parser';
import { EventLog, Event, InstanceDataChange } from './EventLog';
import assert from 'assert';
import { Trace } from './Trace';

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
        const traces = new Array<Trace>();

        if (log.length > 1) {
          console.warn("More than one log, others are ignored...");
        }

        for (const trace of log[0]['trace']) {
          const events = new Array<Event>();

          for (const event of trace['event']) {
            let name = null;
            let from = null;
            let to = null;

            for (const stringEntry of event['string']) {

              if (stringEntry[Props.key] === 'concept:name') {
                name = stringEntry[Props.val];
                continue;
              }
              if (stringEntry[Props.key] === 'sourceRef') {
                from = stringEntry[Props.val];
                continue;
              }
              if (stringEntry[Props.key] === 'targetRef') {
                to = stringEntry[Props.val];
                continue;
              }

            }

            // parse instance data
            // TODO: so far we just assume bool and int equals instance data
            const data = new Array<InstanceDataChange>();
            if ('boolean' in event) {
              for (const entry of event['boolean']) {
                assert(entry[Props.key] && entry[Props.val]);
                data.push(new InstanceDataChange(entry[Props.key], entry[Props.val]));
              }
            }
            if ('int' in event) {
              for (const entry of event['int']) {
                assert(entry[Props.key] && entry[Props.val]);
                data.push(new InstanceDataChange(entry[Props.key], entry[Props.val]));
              }
            }

            assert(name);
            if (!from) console.warn(`No initiator defined in event ${name}`);
            events.push(new Event(name, from, to, data));
          }

          traces.push(new Trace(events));
        }

        return resolve(new EventLog(traces));
      } catch (error) {
        return reject(error);
      }
    });
  }

}
