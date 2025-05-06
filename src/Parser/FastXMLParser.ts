import { InteractionNet } from './InteractionNet';
import { XMLParser } from 'fast-xml-parser';
import { Participant } from './Participant';
import { Element, TaskLabel, Transition, Place, LabelType, Label, PlaceType, Guard, TaskType, SubChoreographyTaskLabel } from './Element';
import { INetParser } from './Parser';
import { deleteFromArray, printInet } from '../util/helpers';

enum Elements {
  rootElements = 'definitions',
  choreographies = 'choreography',
  subChoreographies = 'subChoreography',
  participants = 'participant',
  tasks = 'choreographyTask',
  flows = 'sequenceFlow',
  participantsRef = 'participantRef',
  startEvent = 'startEvent',
  endEvent = 'endEvent',
  exclusiveGateway = 'exclusiveGateway',
  conditionExpression = 'conditionExpression',
  parallelGateway = 'parallelGateway',
  eventGateway = 'eventBasedGateway',
  outs = 'outgoing',
  ins = 'incoming'
}
enum Properties {
  id = '@_id',
  source = '@_sourceRef',
  target = '@_targetRef',
  name = '@_name',
  default = '@_default',
  language = "@_language", 
  initiator = "@_initiatingParticipantRef"
}

export class INetFastXMLParser implements INetParser {
  parser: XMLParser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    isArray: (_, __, ___, isAttribute) => {
      return !isAttribute;
    }
  });

  private static INetTranslator = class {
    iNet = new InteractionNet();
    flows = new Map<string, { flow: any, place: Place|null }>;

    translate(choreography: any): InteractionNet {
      // need to parse participants first, so we can reference them
      this.parseParticipants(choreography[Elements.participants]);
      return this.translateChoreography(choreography);
    }

    translateChoreography(choreography: any): InteractionNet {
      this.iNet.id = choreography[Properties.id];
      this.translateElements(choreography);
      return this.iNet;
    }

    private parseParticipants(participants: any) {
      if (!participants) return;
      for (const par of participants) {
        const newPar = new Participant(par[Properties.id], par[Properties.name]);
        this.iNet.participants.set(par[Properties.id], newPar);
      }
    }

    private translateElements(choreography: any) {
      this
        // need to parse flows first, so they're accessible
        .parseFlows(choreography[Elements.flows])
        .translateStartEvent(choreography[Elements.startEvent])
        .translateEndEvent(choreography[Elements.endEvent])
        .translateTasks(choreography[Elements.tasks])
        this.translateSubChoreography(choreography[Elements.subChoreographies])
        // translate events before gateways
        .translateExclusiveGateways(choreography[Elements.exclusiveGateway])
        .translateParallelGateways(choreography[Elements.parallelGateway])
        .translateEventGateways(choreography[Elements.eventGateway])
        // connect flows last, and report error when a flow leads to an unknown transition, which means
        // we were not able to translate all elements before
        .checkFlows();

      return this.iNet;
    }

    // check if there are sub choreographies, if:
    // recursively translate them
    private translateSubChoreography(subChoreographies: any) {
      if (!subChoreographies) return this;
      for (const subChoreography of subChoreographies) {
        const { initiator, respondents } = this.parseInitiatorRespondents(subChoreography);
        const subNetID = subChoreography[Properties.id];

        // translate sub choreography task
        const subTransition = this.addTransition(new Transition(
          subChoreography[Properties.id], 
          new SubChoreographyTaskLabel(initiator, respondents, subNetID, subNetID, TaskType.CallChoreography))
        );
        this.translateIncomingFlows(subTransition, subChoreography[Elements.ins]);
        this.translateOutgoingFlows(subTransition, subChoreography[Elements.outs]);

        const translator = new INetFastXMLParser.INetTranslator();
        // set subNet participants
        const subNet = translator.iNet;
        subNet.participants.set(initiator.id, initiator);
        for (const respondent of respondents) subNet.participants.set(respondent.id, respondent);
        // translate sub choreography
        this.iNet.subNets.set(subNetID, translator.translateChoreography(subChoreography));
      }
      return this;
    }

    parseFlows(flows: any) {
      if (flows == null) throw new Error(`No flows in the model`);
      for (const flow of flows) {
         this.flows.set(flow[Properties.id], { flow: flow, place: null });
      }
      return this;
    }

    private parseInitiatorRespondents(task: any): { initiator: Participant, respondents: Participant[] } {
      const initiator = this.iNet.participants.get(task[Properties.initiator]);
      if (!initiator) throw new Error(`Initiator of Element not found ${task[Properties.initiator]}`)
      const respondents = new Array<Participant>();
      for (const id of task[Elements.participantsRef]) {
        if (id === initiator.id) continue;
        respondents.push(this.iNet.participants.get(id)!);
      }
      return { initiator, respondents }
    }

    private translateStartEvent(starts: any): this {
      if (!starts || starts.length !== 1) 
        throw new Error("Other than exactly one start event");
  
      const start = starts[0];
      const startEvent = new Transition(start[Properties.id], new Label(LabelType.Start));
      const startPlace = new Place("place_" + start[Properties.id], PlaceType.Start);
      this.linkSourceToTarget(startPlace, startEvent);
      this.addTransition(startEvent);
      this.addPlace(startPlace); // We add it directly, as nothing should be linked to it except the start transtition
      this.iNet.initial = startPlace;
      this.translateOutgoingFlows(startEvent, start[Elements.outs]);
      return this;
    }

    private translateEndEvent(ends: any): this {
      if (!ends || ends.length !== 1) 
        throw new Error("Other than exactly one end event");

      const end = ends[0];
      const endEvent = new Transition(end[Properties.id], new Label(LabelType.End));
      const endPlace = new Place("place_" + end[Properties.id], PlaceType.End);
      endPlace.type = PlaceType.End;
      this.linkSourceToTarget(endEvent, endPlace);
      this.addTransition(endEvent);
      this.addPlace(endPlace); // We add it directly, as nothing should be linked to it except the end transtition
      this.iNet.end = endPlace;
      this.translateIncomingFlows(endEvent, end[Elements.ins]);
      return this;
    }

    private translateTasks(tasks: any): this {
      if (tasks == null) return this;

      for (const task of tasks) {
        const { initiator , respondents } = this.parseInitiatorRespondents(task);
        const transition = this.addTransition(
          new Transition(task[Properties.id], new TaskLabel(initiator!, respondents!, task[Properties.name]))
        );
        this.translateIncomingFlows(transition, task[Elements.ins]);
        this.translateOutgoingFlows(transition, task[Elements.outs]);
      }
      return this;
    }

    /**
     * Event-based Gateway: merge incoming flows and use the merged place to connect to all outgoing events
     * must be translated after events
     * @param gateways 
     * @returns 
     */
    private translateEventGateways(gateways: any) {
      if (gateways == null) return this;

      for (const gateway of gateways) {
        const gatewayID = gateway[Properties.id];

        const inIDs = gateway[Elements.ins];
        const gatewayFlowID = inIDs[0]; // use this flow as gateway place
        const gatewayPlace = this.setFlowPlace(gatewayFlowID, new Place(gatewayID + "_" + inIDs.join("_"))) // flow merge
        for (const inID of inIDs) {
          // assign all incoming flows to gateway place
          this.setFlowPlace(inID, gatewayPlace);
        }

        const outIDs = gateway[Elements.outs];
        if (outIDs.length < 2) {
            throw new Error(`Event Gateway (${gatewayID}) requires at least two outgoing flows`);
        }
        for (const outID of outIDs) {
          const outPlace = this.getPlace(outID);
          if (!outPlace || outPlace.target.length !== 1) 
            throw new Error(`Event-based gateway outgoing flow (${outID}) does not lead to a singular event`);
          const outTransition = outPlace!.target[0]
          if (!this.isEvent(outTransition))
            throw new Error(`Event-based gateway outgoing transition (${outTransition.id}) is not an event`);
          if (outTransition.source.length !== 1)
            throw new Error(`Target elements (${outTransition.id}) of an Event Gateway (${gatewayID}) MUST NOT have any additional incoming Sequence Flows.`);
          // delete the current outgoing flows, as events now connect to the gatewayPlace
          this.deleteElement(outID); 
          this.linkSourceToTarget(gatewayPlace, outTransition); // re-wire event with gateway place
        }
      }
      return this;
    }

    isEvent(el: Transition) {
      return el instanceof Transition &&
      (el.label.type === LabelType.Task);
    }

    /**
     * XOR gateways: create a transition and place for each incoming and outgoing flow
     * @param gateways 
     * @returns 
     */
    private translateExclusiveGateways(gateways: any): this {
      if (gateways == null) return this;

      for (const gateway of gateways) {
        const gatewayID = gateway[Properties.id];
        const outs = gateway[Elements.outs];
        const ins = gateway[Elements.ins];

        if (outs.length === 1 && outs.length < ins.length) {
          // converging
          const convergingPlace = this.setFlowPlace(outs[0], new Place(outs[0]));
          // build transition and link place for each incoming flow
          for (const flowID of ins) {
            const id = `${gatewayID}_${flowID}`;
            const transition = new Transition(id,
              new Label(LabelType.DataExclusiveIncoming));
            this.linkSourceToTarget(this.setFlowPlace(flowID, new Place(flowID)), transition);
            this.linkSourceToTarget(transition, convergingPlace);
            this.addTransition(transition);
          }
        } else if (ins.length === 1 && ins.length < outs.length) {
          // diverging
          const divergingPlace = this.setFlowPlace(ins[0], new Place(ins[0]));
          if (!gateway[Properties.default])
            throw new Error("XOR without an outgoing default flow");

          // build transition for each outcoming flow
          for (const flowID of outs) {
            const id = `${gatewayID}_${flowID}`;
            const transition = new Transition(id,
              new Label(LabelType.DataExclusiveOutgoing));
            // mark guards
            this.translateGuards(transition, flowID, gateway[Properties.default] === flowID);
            this.linkSourceToTarget(transition, this.setFlowPlace(flowID, new Place(flowID)));
            this.linkSourceToTarget(divergingPlace, transition);
            this.addTransition(transition);
          }
        } else {
          throw new Error("Neither converging nor diverging Exclusive (Data or Event) Gateway");
        }
      }
      return this;
    }

    private translateGuards(transition: Transition, flowID: string, defaultFlow: boolean) {
      const flow = this.getFlow(flowID)!.flow;
      const guard = new Guard(flow[Properties.name] ?? "no name")

      if (!defaultFlow) {
          if (!flow[Elements.conditionExpression] || flow[Elements.conditionExpression].length !== 1) {
            throw new Error(`XOR outgoing flow (${flowID}) without or malformed condition script expression`);
          }
          const condition = flow[Elements.conditionExpression][0];
          const lang = condition[Properties.language];
          const expression = condition['#text'];
          if (!expression || !lang)
            throw new Error(`XOR outgoing flow (${flowID}) without proper (language and expression) script condition expression`);
          
          guard.condition = expression;
          guard.language = lang;
        }

      transition.label.guards.set(flowID, guard);
    }

    /**
     * AND Gateways: Add a transition to emulate the gateway
     * @param gateways 
     * @returns 
     */
    private translateParallelGateways(gateways: any): this {
      if (gateways == null)
        return this;

      for (const gateway of gateways) {
        const gatewayID = gateway[Properties.id];
        const outs = gateway[Elements.outs];
        const ins = gateway[Elements.ins];

        if (outs.length === 1 && outs.length < ins.length) {
          // converging
          const gatewayTransition = this.addTransition(
            new Transition(gatewayID, new Label(LabelType.ParallelConverging)));
          this.linkSourceToTarget(gatewayTransition, this.setFlowPlace(outs[0], new Place(outs[0])));
          for (const inID of ins)
            this.linkSourceToTarget(this.setFlowPlace(inID, new Place(inID)), gatewayTransition);
        }
        else if (ins.length === 1 && ins.length < outs.length) {
          // diverging
          const gatewayTransition = this.addTransition(
            new Transition(gatewayID, new Label(LabelType.ParallelDiverging)));
          this.linkSourceToTarget(this.setFlowPlace(ins[0], new Place(ins[0])), gatewayTransition);
          for (const outID of outs)
            this.linkSourceToTarget(gatewayTransition, this.setFlowPlace(outID, new Place(outID)));
        }
        else {
          throw new Error("Neither converging nor diverging AND Gateway");
        }
      }
      return this;
    }

    private checkFlows() {
      if (this.flows.size === 0) throw new Error(`No flows to connect`);

      for (const flow of this.flows.values()) {
        if (!flow.place)
          throw new Error(`Unset Flow ${flow.flow[Properties.id]} found`);

        if (flow.place.type !== PlaceType.End && flow.place.target.length === 0)
          throw new Error(
            `Unconncted Flow ${flow.flow[Properties.id]} found leading to 
            ${flow.flow[Properties.target]} (Target Unsupported Element?)`);
      }
    }

    private linkSourceToTarget(source: Element, target: Element) {
      if (!target.source.includes(source))
        target.source.push(source);
      if (!source.target.includes(target))
        source.target.push(target);
    }

    private unlinkElement(id: string) {
      const el = this.iNet.elements.get(id);
      if (el) {
        for (const source of el.source) deleteFromArray(source.target, el);
        for (const target of el.target) deleteFromArray(target.source, el);
      }
    }

    private deleteElement(id: string) {
      this.unlinkElement(id);
      this.iNet.elements.delete(id);
    }

    private getPlace(id: string) {
      return this.flows.get(id)?.place;
    }

    private getFlow(id: string) {
      return this.flows.get(id);
    }

    private setFlowPlace(id: string, place: Place): Place {
      const existing = this.getFlow(id);
      if (!existing) throw Error(`Flow not found: ${id}`);
      if (existing.place) {
        this.mergePlaces(place, existing.place);
      } else {
        existing.place = this.addPlace(place);
      }
      this.flows.set(id, existing);
      return existing.place;
    }

    private addPlace(el: Place): Place {
      return this.addElement(el) as Place;
    }

    private mergePlaces(add: Place, existing: Place): Place {
      // Copy all sources of del into keep
      for (const source of add.source) if (!existing.source.includes(source)) existing.source.push(source);
      for (const target of add.target) if (!existing.target.includes(target)) existing.target.push(target);
      return existing;
    }

    private addTransition(el: Transition): Transition {
      return this.addElement(el) as Transition;
    }

    private addElement(el: Element): Element {
      // Be aware of already connected places
      if (!this.iNet.elements.has(el.id))
        this.iNet.elements.set(el.id, el);

      return this.iNet.elements.get(el.id)!;
    }

    translateOutgoingFlows(transition: Transition, outIDs: any[]) {
      for (const id of outIDs) {
        this.linkSourceToTarget(
          transition, 
          this.setFlowPlace(id, new Place(id)));
      }
    }

    translateIncomingFlows(transition: Transition, inIDs: any[]) {
      const place = new Place(inIDs.join("_")) // flow merge
      for (const id of inIDs) {
        this.linkSourceToTarget(
          this.setFlowPlace(id, place),
          transition);
      }
    }
  }

  fromXML(xml: Buffer): Promise<InteractionNet[]> {
    return new Promise<InteractionNet[]>((resolve, reject) => {
      const parsed = this.parser.parse(xml.toString());
      const rootElements = parsed[Elements.rootElements][0];
      if (!(Elements.choreographies in rootElements) || rootElements[Elements.choreographies].length < 1) {
        return reject(new Error("No choreography found"));
      }
      const iNets = new Array<InteractionNet>();
      for (const choreography of rootElements[Elements.choreographies]) {
        const iNetTranslator = new INetFastXMLParser.INetTranslator();
        try {
          const iNet = iNetTranslator.translate(choreography);
          iNets.push(iNet);
        } catch (error) {
          return reject(error);
        }
      }
      //console.log(iNets);
      return resolve(iNets);
    });
  }
}