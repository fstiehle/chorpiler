import { InteractionNet } from './InteractionNet';
import { XMLParser } from 'fast-xml-parser';
import { Participant } from './Participant';
import { Element, TaskLabel, Transition, Place, LabelType, Label, PlaceType, Guard } from './Element';
import { INetParser } from './Parser';
import { deleteFromArray } from '../util/helpers';
import assert from 'assert';

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
  conditionExpression = 'bpmn:conditionExpression',
  parallelGateway = 'bpmn2:parallelGateway',
  eventGateway = 'bpmn2:eventBasedGateway',
  outs = 'bpmn2:outgoing',
  ins = 'bpmn2:incoming'
}
enum Properties {
  id = '@_id',
  source = '@_sourceRef',
  target = '@_targetRef',
  name = '@_name',
  default = '@_default',
  language = "@_language", 
}
enum ExclusiveGatewayType {
  Data,
  Event
}

export class INetFastXMLParser implements INetParser {
  parser: XMLParser = new XMLParser({
    ignoreAttributes: false,
    isArray: (_, __, ___, isAttribute) => {
      return !isAttribute;
    }
  });

  private static INetTranslator = class {
    iNet = new InteractionNet();

    translate(choreography: any): InteractionNet {
      this.iNet.id = choreography[Properties.id];
      //console.log(choreography);

      this
        .parseParticipants(choreography[Elements.participants])
        .translateStartEvent(choreography[Elements.startEvent])
        .translateTasks(choreography[Elements.tasks])
        .translateDataGateway(choreography[Elements.exclusiveGateway])
        .translateEventGateway(choreography[Elements.eventGateway])
        .translateParallelGateway(choreography[Elements.parallelGateway])
        .translateEndEvent(choreography[Elements.endEvent])
        // connect flows last, and report error when a flow leads to an unknown transition, which means
        // we were not able to translate all elements
        .connectFlows(choreography[Elements.flows]);
      return this.iNet;
    }

    private parseParticipants(participants: any): this {
      for (const par of participants) {
        const newPar = new Participant(par[Properties.id], par[Properties.name]);
        this.iNet.participants.set(par[Properties.id], newPar);
      };
      return this;
    }

    private translateStartEvent(starts: any): this {
      if (starts.length !== 1) {
        throw new Error("Other than exactly one start event");
      }
      const start = starts[0];
      const startEvent = new Transition(start[Properties.id], new Label(LabelType.Start));
      const startPlace = new Place(PlaceType[PlaceType.Start]);
      startPlace.type = PlaceType.Start;
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
      const endEvent = new Transition(end[Properties.id], new Label(LabelType.End));
      const endPlace = new Place(PlaceType[PlaceType.End]);
      endPlace.type = PlaceType.End;
      this.linkElements(endEvent, endPlace);
      this.addElement(endEvent);
      this.addElement(endPlace);
      this.iNet.end = endPlace;
      return this;
    }

    private translateTasks(tasks: any): this {
      if (tasks == null) {
        return this;
      }
      for (const task of tasks) {
        const from = this.iNet.participants.get(task[Elements.participantsRef][0]);
        const to = this.iNet.participants.get(task[Elements.participantsRef][1]);
        this.addElement(new Transition(task[Properties.id], new TaskLabel(from!, to!, task[Properties.name])));
      
        // check for an uncontrolled flow merge, i.e., more than one incoming sequence flows
        // if present, we merge them later when the flows are connected.
        if (task[Elements.ins].length > 1) {
          for (const _in of task[Elements.ins]) {
            this.addElement(new Place(_in, PlaceType.UncontrolledMerge));
          }
        }
      }
      return this;
    }

    private translateDataGateway(gateways: any) {
      this.translateExclusiveGateway(gateways, ExclusiveGatewayType.Data);
      return this;
    }

    private translateEventGateway(gateways: any) {
      this.translateExclusiveGateway(gateways, ExclusiveGatewayType.Event);
      return this;
    }

    private translateExclusiveGateway(gateways: any, type: ExclusiveGatewayType): this {
      if (gateways == null)
        return this;

      for (const gateway of gateways) {
        const gatewayID = gateway[Properties.id];
        const outs = gateway[Elements.outs];
        const ins = gateway[Elements.ins];
        const transitions = new Array<Transition>();

        if (type === ExclusiveGatewayType.Event && outs.length < 2) {
          throw new Error("Event Gateway needs at least two outgoing flows");
          // TODO: Check that the outgoings lead to events
        }

        if (outs.length === 1 && outs.length < ins.length) {
          // converging
          // build transition for each incoming flow
          for (const flowID of ins) {
            const id = `${gatewayID}_${flowID}`;
            const transition = new Transition(id,
              new Label((type === ExclusiveGatewayType.Data) ? LabelType.DataExclusiveIncoming : LabelType.EventExclusiveIncoming));
            const place = this.addElement(new Place(flowID));
            this.linkElements(place, transition);
            transitions.push(transition);
          }
          const place = this.addElement(new Place(outs[0]));
          for (const t of transitions) {
            this.linkElements(t, place);
            this.addElement(t);
          }
        } else if (ins.length === 1 && ins.length < outs.length) {
          // diverging
          if (type === ExclusiveGatewayType.Data) {
            if (!gateway[Properties.default]) {
              throw new Error("XOR without an outgoing default flow");
            }
          }
          // build transition for each outcoming flow
          for (const flowID of outs) {
            const id = `${gatewayID}_${flowID}`;
            const transition = new Transition(id,
              new Label((type === ExclusiveGatewayType.Data) ? LabelType.DataExclusiveOutgoing : LabelType.EventExclusiveOutgoing));
            // set default flow
            if (type === ExclusiveGatewayType.Data && flowID === gateway[Properties.default]) {
              transition.label.guards.set(flowID, new Guard("", true));
            }
            const place = this.addElement(new Place(flowID));
            this.linkElements(transition, place);
            transitions.push(transition);
          }
          const place = this.addElement(new Place(ins[0]));
          for (const t of transitions) {
            this.linkElements(place, t);
            this.addElement(t);
          }
        } else {
          throw new Error("Neither converging nor diverging Exclusive (Data or Event) Gateway");
        }
      }
      return this;
    }

    private translateParallelGateway(gateways: any): this {
      if (gateways == null)
        return this;

      for (const gateway of gateways) {
        const gatewayID = gateway[Properties.id];
        const outs = gateway[Elements.outs];
        const ins = gateway[Elements.ins];

        if (outs.length === 1 && outs.length < ins.length) {
          // converging
          this.addElement(new Transition(gatewayID,
            new Label(LabelType.ParallelConverging)));
        }
        else if (ins.length === 1 && ins.length < outs.length) {
          // diverging
          this.addElement(new Transition(gatewayID,
            new Label(LabelType.ParallelDiverging)));
        }
        else {
          throw new Error("Neither converging nor diverging AND Gateway");
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
        const name = flow[Properties.name];

        const place = this.addElement(new Place(id)) as Place;

        if (place.source.length === 0) {
          const source = this.iNet.elements.get(flow[Properties.source]);
          if (!source) throw new Error(
            `Unsupported Element ${flow[Properties.source]} as source referenced in flow ${id}`);
          this.linkElements(source, place);
        }

        if (place.target.length === 0) {
          const target = this.iNet.elements.get(flow[Properties.target]);
          if (!target) throw new Error(
            `Unsupported Element ${flow[Properties.target]} as target referenced in flow ${id}`);
          this.linkElements(place, target);
        }

        // look for guard information 
        for (const sourceTransition of place.source) {
          if (sourceTransition instanceof Transition
          && sourceTransition.label.type === LabelType.DataExclusiveOutgoing) {
            // the flow leads to an outgoing exclusive gateway transition,
            // we need to assign the condition of the flow to the transition
            const guard = sourceTransition.label.guards.get(id);
            if (guard != null && guard.default) {
              // the guard of the default flow is already present,
              // so we only set additional info
              guard.name = name != null ? name : "no name";
            } else {
              // if it is not a default flow it needs to have an expression present
              if (!flow[Elements.conditionExpression] || flow[Elements.conditionExpression].length !== 1) {
                throw new Error(`XOR outgoing flow (${id}) without or malformed condition expression`);
              }
              const condition = flow[Elements.conditionExpression][0];
              const lang = condition[Properties.language];
              const expression = condition['#text'];
              if (!expression || !lang) {
                throw new Error(
                  `XOR outgoing flow (${id}) without proper (language and expression) condition expression`);
              }
              const guard = new Guard(name != null ? name : "no name", false);
              guard.condition = expression;
              guard.language = lang;
              sourceTransition.label.guards.set(id, guard);
            }
          }
        }

        // merge uncontrolled flow merge, i.e., more than one incoming sequence flow into a task
        // we merge the places to create the equivalent of an XOR, 
        // which is closer to the standard, than an AND merge behaviour, 
        // which is what we would create by default.
        if (place.type === PlaceType.UncontrolledMerge) {
          this.mergePlace(place);
        }
      }
    }

    private linkElements(source: Element, target: Element) {
      target.source.push(source);
      source.target.push(target);
    }

    private unlinkElement(el: Element) {
      for (const source of el.source)
        deleteFromArray(source.target, el);
      for (const target of el.target)
        deleteFromArray(target.source, el);
    }

    private addElement(el: Element): Element {
      // Be aware of already connected places
      if (!this.iNet.elements.has(el.id))
        this.iNet.elements.set(el.id, el);
      return this.iNet.elements.get(el.id)!;
    }

    private mergePlace(place: Place) {
      assert(place.source.length === 1 && place.target.length === 1);
      const source = place.source[0];
      const target = place.target[0];

      const mergedPlace = this.addElement(new Place("merged_" + target.id)) as Place;
      if (mergedPlace.target.length === 0) this.linkElements(mergedPlace, target);
      this.linkElements(source, mergedPlace);
      this.unlinkElement(place);
      this.iNet.elements.delete(place.id);
      return mergedPlace;
    }
  };

  fromXML(xml: Buffer): Promise<InteractionNet> {
    return new Promise<InteractionNet>((resolve, reject) => {
      const parsed = this.parser.parse(xml.toString());
      const rootElements = parsed[Elements.rootElements][0];
      if (!(Elements.choreographies in rootElements)) {
        return reject("No choreography found");
      }
      if (rootElements[Elements.choreographies].length !== 1) {
        // we don't support call choreographies yet.
        console.warn("Warning: More than one choreography found, others are ignored.");
      }
      const choreography = rootElements[Elements.choreographies][0];
      // TODO: verify there is no element we don't support
      const iNetTranslator = new INetFastXMLParser.INetTranslator();
      try {
        const iNet = iNetTranslator.translate(choreography);
        //console.log(iNet)
        return resolve(iNet);
      } catch (error) {
        return reject(error);
      }
    });
  }
}