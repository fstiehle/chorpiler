import InteractionNet from './InteractionNet';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import Participant from './Participant';
import { EventLabel, GatewayLabel, GatewayType, TaskLabel, Transition } from './Transition';
import Place from './Place';

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
    iNet: InteractionNet;

    constructor() {
      this.iNet = new InteractionNet();
    }

    translate(choreography: any): InteractionNet {
      // console.log(choreography);

      this.iNet.id = choreography[Properties.id];
      this.parseParticipants(choreography[Elements.participants]);
      this.translateStartEvent(choreography[Elements.startEvent]);
      this.translateTasks(choreography[Elements.tasks]);
      this.translateXOR(choreography[Elements.exclusiveGateway]);
      this.translateEndEvent(choreography[Elements.endEvent]);

      // connect flows last, and report error when a flow leads to an unknown transition, which means
      // we were not able to translate all elements
      this.connectFlows(choreography[Elements.flows]);
      return this.iNet;
    }

    private parseParticipants(participants: any) {
      for (const par of participants) {
        const newPar = new Participant(par[Properties.id]);
        this.iNet.participants.set(par[Properties.id], newPar);
      };
    }

    private translateStartEvent(starts: any) {
      if (starts.length !== 1) {
        throw new Error("Other than exactly one start event")
      }
      const start = starts[0];
      const startEvent = new Transition(start[Properties.id], new EventLabel());
      const startPlace = new Place(start[Properties.id]);
      startPlace.target = startEvent;
      startEvent.in.push(startPlace);
      this.iNet.places.set(start[Properties.id], startPlace);
      this.iNet.transitions.set(start[Properties.id], startEvent);
      this.iNet.initial = startEvent;
    }

    private translateEndEvent(ends: any) {
      if (ends.length !== 1) {
        throw new Error("Other than exactly one end event")
      }
      const end = ends[0];
      const endEvent = new Transition(end[Properties.id], new EventLabel());
      const endPlace = new Place(end[Properties.id]);
      endPlace.source = endEvent;
      endEvent.out.push(endPlace);
      this.iNet.places.set(end[Properties.id], endPlace);
      this.iNet.transitions.set(end[Properties.id], endEvent);
      this.iNet.end = endEvent;
    }

    private translateTasks(tasks: any) {
      for (const task of tasks) {
        const from = this.iNet.participants.get(task[Elements.participantsRef][0]);
        const to = this.iNet.participants.get(task[Elements.participantsRef][1]);
        const trans = new Transition(task[Properties.id], new TaskLabel(from!, to!));
        this.iNet.transitions.set(trans.id, trans);
      }
    }

    private translateXOR(gateways: any) {
      for (const gateway of gateways) {
        const gatewayID = gateway[Properties.id];

        // connect gateway outs
        for (const flowID of gateway[Elements.outs]) {
          const id = `${gatewayID}_${flowID}`;
          const transition = new Transition(id, 
            new GatewayLabel(GatewayType.Exclusive));
          const place = new Place(flowID);
          place.source = transition;
          transition.out.push(place);
          this.iNet.places.set(flowID, place);
          this.iNet.transitions.set(id, transition);
        }
        // connect gateway ins
        for (const flowID of gateway[Elements.ins]) {
          const id = `${gatewayID}_${flowID}`;
          const transition = new Transition(id, 
            new GatewayLabel(GatewayType.Exclusive));
          const place = new Place(flowID);
          place.target = transition;
          transition.in.push(place);
          this.iNet.places.set(flowID, place);
          this.iNet.transitions.set(id, transition);
        }
      }
    }

    private connectFlows(flows: any) {
      for (const flow of flows) {
        const placeID = flow[Properties.id];
        
        // Be aware of already connected places
        if (!this.iNet.places.has(placeID)) {
          this.iNet.places.set(placeID, new Place(placeID));
        }
        const place = this.iNet.places.get(placeID)!;
        if (!place.source) {
          const source = this.iNet.transitions.get(flow[Properties.source]);
          if (!source) throw new Error(`Unsupported Element ${flow[Properties.source]} referenced in flow ${placeID}`);
          place.source = source;
          source.out.push(place);
        }
        if (!place.target) {
          const target = this.iNet.transitions.get(flow[Properties.target]);
          if (!target) throw new Error(`Unsupported Element ${flow[Properties.target]} referenced in flow ${placeID}`);
          place.target = target;
          target.in.push(place);
        }
      }
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