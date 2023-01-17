import InteractionNet from './InteractionNet';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import Participant from './Participant';
import { Element, EventLabel, GatewayLabel, GatewayType, TaskLabel, Transition, Place } from './Element';

export interface INetParser {
  fromXML(xml: Buffer): Promise<InteractionNet>;
}

enum Elements {
  rootElements = 'bpmn2:definitions',
  choreographies = 'bpmn2:choreography',
  participants = 'bpmn2:participant',
  tasks = 'bpmn2:choreographyTask',
  flows = 'bpmn2:sequenceFlow',
  participantsRef = 'bpmn2:participantRef',
  startEvent = 'bpmn2:startEvent',
  endEvent = 'bpmn2:endEvent',
  exclusiveGateway = 'bpmn2:exclusiveGateway',
  outs = 'bpmn2:outgoing',
  ins = 'bpmn2:incoming'
}

enum Properties {
  id = '@_id',
  source = '@_sourceRef',
  target = '@_targetRef'
}

export class INetFastXMLParser implements INetParser {
  parser: XMLParser = new XMLParser({ 
    ignoreAttributes: false,
    isArray: (_, __, ___, isAttribute) => { 
      return !isAttribute;
    }
  });

  static INetTranslator = class {
    iNet = new InteractionNet();

    translate(choreography: any): InteractionNet {
      this.iNet.id = choreography[Properties.id];

      this
      .parseParticipants(choreography[Elements.participants])
      .translateStartEvent(choreography[Elements.startEvent])
      .translateTasks(choreography[Elements.tasks])
      .translateXOR(choreography[Elements.exclusiveGateway])
      .translateEndEvent(choreography[Elements.endEvent])
      // connect flows last, and report error when a flow leads to an unknown transition, which means
      // we were not able to translate all elements
      .connectFlows(choreography[Elements.flows]);
      return this.iNet;
    }

    private parseParticipants(participants: any): this {
      for (const par of participants) {
        const newPar = new Participant(par[Properties.id]);
        this.iNet.participants.set(par[Properties.id], newPar);
      };
      return this;
    }

    private translateStartEvent(starts: any): this {
      if (starts.length !== 1) {
        throw new Error("Other than exactly one start event");
      }
      const start = starts[0];
      const startEvent = new Transition(start[Properties.id], new EventLabel());
      const startPlace = new Place("initial");
      this.linkElements(startPlace, startEvent);
      this.iNet.initial = startPlace;
      this.addElement(startEvent);
      this.addElement(startPlace);
      return this;
    }

    private translateEndEvent(ends: any): this {
      if (ends.length !== 1) {
        throw new Error("Other than exactly one end event");
      }
      const end = ends[0];
      const endEvent = new Transition(end[Properties.id], new EventLabel());
      const endPlace = new Place("end");
      this.linkElements(endEvent, endPlace);
      this.addElement(endEvent);
      this.addElement(endPlace);
      this.iNet.end = endPlace;
      return this;
    }

    private translateTasks(tasks: any): this {
      for (const task of tasks) {
        const from = this.iNet.participants.get(task[Elements.participantsRef][0]);
        const to = this.iNet.participants.get(task[Elements.participantsRef][1]);
        this.addElement(
          new Transition(task[Properties.id], new TaskLabel(from!, to!))
        );
      }
      return this;
    }

    private translateXOR(gateways: any): this {
      for (const gateway of gateways) {
        const gatewayID = gateway[Properties.id];
        const outs = gateway[Elements.outs];
        const ins = gateway[Elements.ins];
        const transitions = new Array<Transition>();

        if (outs.length === 1 && outs.length < ins.length) {
          // converging
          // build transition for each incoming flow
          for (const flowID of ins) {
            const id = `${gatewayID}_${flowID}`;
            const transition = new Transition(id, 
              new GatewayLabel(GatewayType.Exclusive));
            const place = new Place(flowID);
            this.linkElements(place, transition);
            transitions.push(transition);
            this.addElement(place);
          }
          const place = new Place(outs[0]);
          this.addElement(place);
          for (const t of transitions) {
            this.linkElements(t, place);
            this.addElement(t);
          }
        } else if (ins.length === 1 && ins.length < outs.length) {
          // diverging
          // build transition for each outcoming flow
          for (const flowID of outs) {
            const id = `${gatewayID}_${flowID}`;
            const transition = new Transition(id, 
              new GatewayLabel(GatewayType.Exclusive));
            const place = new Place(flowID);
            this.linkElements(transition, place);
            transitions.push(transition);
            this.addElement(place);
          }
          const place = new Place(ins[0]);
          this.addElement(place);
          for (const t of transitions) {
            this.linkElements(place, t);
            this.addElement(t);
          }
        } else {
          throw new Error("Neither converging nor diverging XOR Gateway");
        }
      }
      return this;
    }

    private connectFlows(flows: any) {
      if (this.iNet.initial == null) {
        throw new Error("No start event translated");
      }

      for (const flow of flows) {
        const id = flow[Properties.id];

        // Be aware of already connected places
        let place = this.iNet.elements.get(id);
        if (!place) {
          place = this.addElement(new Place(id));
        }
        if (place.source.length === 0) {
          const source = this.iNet.elements.get(flow[Properties.source]);
          if (!source) throw new Error(
            `Unsupported Element ${flow[Properties.source]} referenced in flow ${id}`);
          this.linkElements(source, place);
        }
        if (place.target.length === 0) {
          const target = this.iNet.elements.get(flow[Properties.target]);
          if (!target) throw new Error(
            `Unsupported Element ${flow[Properties.target]} referenced in flow ${id}`);
          this.linkElements(place, target);
        }
      }
    }

    private linkElements(source: Element, target: Element) {
      target.source.push(source);
      source.target.push(target);
    }

    private addElement(el: Element): Element {
      this.iNet.elements.set(el.id, el);
      return this.iNet.elements.get(el.id)!;
    }
  }

  fromXML(xml: Buffer): Promise<InteractionNet> {
    return new Promise<InteractionNet>((resolve, reject) => {
      const parsed = this.parser.parse(xml.toString());
      const rootElements = parsed[Elements.rootElements][0];
      if (!(Elements.choreographies in rootElements)) {
        return reject("No choreography found");
      }
      if (rootElements[Elements.choreographies].length !== 1) {
        // we don't support call choreographies yet.
        console.warn("More than one choreography found, others are ignored.")
      }
      const choreography = rootElements[Elements.choreographies][0];
      // TODO: verify there is no element we don't support

      const iNetTranslator = new INetFastXMLParser.INetTranslator();
      try {
        const iNet = iNetTranslator.translate(choreography);
        return resolve(iNet);
      } catch (error) {
        console.error(error);
        return reject(error);
      }
    })
  }
}