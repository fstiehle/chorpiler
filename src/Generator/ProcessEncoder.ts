/**
 * Generates a conformance check solidity contract from an interaction petri net.
 * A manual transition can be enacted when the conditions for it are met, i.e.,
 * the task is enabled and the correct participant is calling.
 * An Autonomous transition is performed by the smart contract automatically as soon as 
 * the conditions are met. The conditions are checked after a manual transition is attempted.
 */
import { deleteFromArray } from '../util/helpers';
import { Transition, Element, TaskLabel, LabelType, Place, PlaceType, TaskType, Guard } from '../Parser/Element';
import { InteractionNet } from '../Parser/InteractionNet';
import { ProcessEncoding, SubProcessEncoding } from './ProcessEncoding';
import { Template } from './Template';
import { assert } from 'console';

export class ProcessEncoder {

  static generate(
    _iNet: InteractionNet, 
    options: { unfoldSubNets: boolean } // If true,
    // sub choreographies are "folded" into the main choreography, i.e.,
    // they are treated as visual option only with no consequence for the generated contract
  ) {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    const templateOptions = new Template.Process();
    // create participant template options and IDs
    templateOptions.numberOfParticipants = iNet.participants.size.toString();
    const participantIDs = new Map<string, number>();
    const participants = new Map<string, InstanceType<typeof Template.Participant>>();
    for (let parID = 0; parID < iNet.participants.size; parID++) {
      const par = [...iNet.participants.values()][parID];
      participantIDs.set(par.id, parID);
      const participant = new Template.Participant(
        parID.toString(),
        par.id,
        par.name,
        "[template]" // TODO: Make this setable in the TemplateEngine
      );
      participants.set(par.id, participant);
      templateOptions.participants.push(participant);
    }

    const subNetIDs = new Map<string, SubProcessEncoding>()
    if (options.unfoldSubNets) {
      // sub choreographies are "folded" into the main choreography, i.e.,
      // they are treated as visual option only with no consequence for the generated contract
      this.unfoldSubNets(iNet); // TODO: Recursively unfold all subnets
    } else {
      // recursively encode subnets
      this.encodeSubNets(iNet, subNetIDs, participantIDs);
    }

    // optimisation step by removing silent transitions
    // we need to first unfold subnets, so they're also optimised correctly
    this.removeSilentTransitions(iNet);

    const { encodedTransitions, taskIDs } = ProcessEncoder.encodeTransitions(iNet, participantIDs);
    templateOptions.transitions = encodedTransitions;

    return { encoding: new ProcessEncoding(taskIDs, participantIDs, subNetIDs), templateOptions };
  }

  // for each subnet
    // set participants 
    // encode transitions
    // set transitionary transitions 
    //    (either in from parent): state = 1 -> set place in parent accordingly
    //    (either out to parent):  state = 0 -> set palce in parent accordingly

    // repeat recursively
    //this.encodeSubNets()
  private static encodeSubNets(
    iNet: InteractionNet, 
    subNetIDs: Map<string, SubProcessEncoding>, 
    participantIDs: Map<string, number>
  ) {
    const template = new Array<InstanceType<typeof Template.SubProcess>>()

    for (const subNet of iNet.subNets.values()) {
      // optimisation step by removing silent transitions
      this.removeSilentTransitions(subNet);

      const subNetTransition = iNet.elements.get(subNet.id) as Transition;
      if (!subNetTransition)
        throw new Error(`sub net (ID: ${subNet.id}) with no corresponding transition in parent net (ID: ${iNet.id}) found`);
    }
  }

  private static encodeTransitions(iNet: InteractionNet, participantIDs: Map<string, number>) {
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    // transitions to ids
    const taskIDs = new Map<string, number>();
    const transitions = new Array<Transition>();

    for (const element of iNet.elements.values()) {
      if (!(element instanceof Transition)) {
        continue;
      }
      if (element.source.length === 0 && element.target.length === 0) {
        throw new Error(`Unconnected transition in interaction net ${element.id}`);
      }
      if (!this.isSilentTransition(element)) {
        taskIDs.set(element.id, taskIDs.size);
      }
      transitions.push(element);
    }

    const encodedTransitions = new Template.Transitions();
    const transitionMarkings = new Map<string, number>();
    let transitionCounter = 1;
    // add start and end event
    transitionMarkings.set(iNet.initial.id, 1);
    transitionMarkings.set(iNet.end.id, 0);

    for (const element of transitions) {

      // build condition for transition
      const { condition, defaultBranch } = this.buildCondition(element.label.guards);

      // determine sequence flows
      // console.log("ID", references.get(element.id));
      let consume = 0;
      let produce = 0;
      // console.log("EID", element.id);
      // collect consuming places
      // console.log("INS____");
      for (const _in of element.source) {
        // console.log(_in);
        if (!transitionMarkings.get(_in.id)) {
          transitionMarkings.set(_in.id, 2 ** transitionCounter);
          transitionCounter++;
        }
        consume += transitionMarkings.get(_in.id)!;
        // console.log(consume)
      }
      // collect producing places
      // console.log("OUT____");
      let isEnd = false;
      for (const out of element.target) {
        // console.log(out);
        if (out instanceof Place && out.type == PlaceType.End) {
          // leads to end event
          isEnd = true;
          // we don"t need to increase the marking counter
          // as 0 doesn't take away a spot
        } else if (!transitionMarkings.get(out.id)) {
          transitionMarkings.set(out.id, 2 ** transitionCounter);
          transitionCounter++;
        }
        produce += transitionMarkings.get(out.id)!;
        // console.log(produce)
      }

      if (this.isSilentTransition(element)) {
        let id = "";
        if (element.target.length === 1 && element.target[0].target.length === 1
          && this.isEventTransition(element.target[0].target[0])) {
          // Check if silent transition leads to an event that may be triggered 
          // if yes, assign event ID to autonomous transition
          id = taskIDs.get(element.target[0].target[0].id)!.toString();
        }

        if (element.label.type !== LabelType.End) {
          if (defaultBranch) {
            encodedTransitions.preAuto.else.push(new Template.Transition(
              consume.toString(), produce.toString(), isEnd, condition));
          } else {
            encodedTransitions.preAuto.if.push(new Template.IDTransition(
              id.toString(), consume.toString(), produce.toString(), isEnd, condition));
          }
          // auto end transitions must fire even after manual transitions
        } else {
          encodedTransitions.postAuto.if.push(new Template.Transition(
            consume.toString(), produce.toString(), isEnd, condition));
        }
      }
      else if (element.label instanceof TaskLabel) {
        encodedTransitions.manual.if.push(new Template.ManualTransition(
          taskIDs.get(element.id)!.toString(),
          participantIDs.get(element.label.sender.id)!.toString(),
          consume.toString(),
          produce.toString(),
          isEnd,
          condition
        ));
      }
    }
    return { encodedTransitions, taskIDs };
  }

  private static buildCondition(guardsMap: Map<string, Guard>) {
    let condition = "";
    let defaultBranch = false;

    const guards = [...guardsMap.values()]
    if (guards.length > 0) {
      const first = guards.at(0)!;
      if (first.default) defaultBranch = true;
      if (first.condition) condition += `(${first.condition})`;
    }
    if (guards.length > 1) {
      guards.shift();
      for (const guard of guards) {
        if (guard.default) defaultBranch = true;
        if (guard.condition) condition += `&& (${guard.condition})`;
      }
    }
    return { condition, defaultBranch };
  }

  private static removeSilentTransitions(iNet: InteractionNet) {
    for (const element of iNet.elements.values()) {
      if (element.source.length === 1 && element.target.length === 1) {
        const source = element.source[0];
        const target = element.target[0];
        if (this.isSilentTransition(element)) {
          // a previous place only connected to this transition but with other previous transitions
          if (source.target.length === 1 && source.source.length > 0) {
            this.linkNewSources(target, source.source);
            this.copyProperties(element as Transition, source.source as Transition[]);
            this.deleteElement(iNet, element);
            this.deleteElement(iNet, source);
            // target place only connected to this transition but with other target transitions
          } else if (target.source.length === 1 && target.target.length > 0) {
            this.linkNewTargets(source, target.target);
            this.copyProperties(element as Transition, target.target as Transition[]);
            this.deleteElement(iNet, element);
            this.deleteElement(iNet, target);
          }
        } else if (element instanceof Place
          && this.isSilentTransition(source) && this.isSilentTransition(target)) {
          // two AND gateways (silent transitions) in sucession 
          this.linkNewSources(source, target.source);
          this.linkNewTargets(source, target.target);
          this.copyProperties(target as Transition, [source as Transition]);
          this.deleteElement(iNet, element);
          this.deleteElement(iNet, target);
        }
      } else if (this.isSilentTransition(element) 
        && element.source.length === 1 && element.source[0].source.length > 0 
        && element.target.length > 1) {
        // XOR -> AND, XOR not immediately after start event
        const xorPlace = element.source[0];
        const andPlaces = element.target;
        for (const prevTransition of xorPlace.source) {
          this.linkNewTargets(prevTransition, andPlaces);
        }
        for (const andPlace of andPlaces) {
          this.linkNewTargets(andPlace, xorPlace.target);
        }
        this.deleteElement(iNet, element);
        this.deleteElement(iNet, xorPlace); 
      }
    }
  }

  /**
   * Unfolds Sub choreographies into the main net,
   * For each sub choreography transition
   * @param iNet 
   */
  private static unfoldSubNets(iNet: InteractionNet) {
    for (const subNet of iNet.subNets.values()) {
      const subNetTransition = iNet.elements.get(subNet.id) as Transition;
      if (!subNetTransition)
        throw new Error(`SubNet with no corresponding transition in main net found: ${subNet.id}`);

      // add all elements to mainnet
      for (const element of subNet.elements) iNet.elements.set(element[0], element[1]);
      // replace subNetTransition with start transition of subnet
      assert(subNet.initial && subNet.initial.target.length === 1);
      const startTransition = subNet.initial!.target[0] as Transition;
      // link sources of subNetTransition to start transition
      this.linkNewSources(startTransition, subNetTransition.source);
      this.copyProperties(subNetTransition, [startTransition]);
      // replace subNet end event with target of subNetTransition
      assert(subNet.end && subNet.end.source.length === 1);
      const endTransition = subNet.end!.source[0] as Transition;
      this.linkNewTargets(endTransition, subNetTransition.target);

      this.deleteElement(iNet, subNet.end!);
      this.deleteElement(iNet, subNet.initial!);
      this.deleteElement(iNet, subNetTransition);
    }
    iNet.subNets.clear();
  }

  private static isSilentTransition(el: Element) {
    return el instanceof Transition &&
    (  el.label.type === LabelType.DataExclusiveIncoming
    || el.label.type === LabelType.DataExclusiveOutgoing
    || el.label.type === LabelType.EventExclusiveIncoming
    || el.label.type === LabelType.EventExclusiveOutgoing
    || el.label.type === LabelType.ParallelConverging
    || el.label.type === LabelType.ParallelDiverging
    || el.label.type === LabelType.Start
    || el.label.type === LabelType.End );
  }

  private static isEventTransition(el: Element) {
    return el instanceof Transition &&
    (el.label.type === LabelType.Task);
  }

  private static deleteElement(iNet: InteractionNet, el: Element) {
    this.unlinkAllSources(el);
    this.unlinkAllTargets(el);
    iNet.elements.delete(el.id);
  }

  private static unlinkAllSources(el: Element) {
    if(el.source.length === 0) return;
    for (const source of el.source)
      deleteFromArray(source.target, el);
    el.source = new Array();
  }

  private static unlinkAllTargets(el: Element) {
    if (el.target.length === 0) return;
    for (const target of el.target)
      deleteFromArray(target.source, el);
    el.target = new Array();
  }

  private static linkNewSources(el: Element, sources: Element[]) {
    el.source.push(...sources);
    for (const transition of sources)
      transition.target.push(el);
  }

  private static linkNewTargets(el: Element, targets: Element[]) {
    el.target.push(...targets);
    for (const transition of targets)
      transition.source.push(el);
  }

  private static copyProperties(copyFrom: Transition, copyTo: Transition[]) {
    // copy gateway guards
    if (copyFrom.label.guards.size === 0) {
      return;
    }
    for (const transition of copyTo) {
      transition.label.guards = new Map([...copyFrom.label.guards, ...transition.label.guards]);
    }
  }
}