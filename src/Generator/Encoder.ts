/**
 * Generates a Encoding from an INet, by removing silent transitions and encoding tasks in a bit array fashion, 
 * the template can be used to render the process token play by a TemplateEngine
 */
import { deleteFromArray } from '../util/helpers';
import { Transition, Element, TaskLabel, LabelType, Place, PlaceType, TaskType, Guard } from '../Parser/Element';
import { InteractionNet } from '../Parser/InteractionNet';
import * as Encoding from "./Encoding/Encoding";
import { assert } from 'console';

export class INetEncoder {

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
    const encoded = new Encoding.MainProcess(iNet.id);
    // create participant template options and IDs
    [...iNet.participants.values()].forEach((par, encodedID) => {
      encoded.participants.set(par.id, new Encoding.Participant(
        encodedID, // encoded ID from 0..N
        par.id, // ID as in Model
        par.name,
        "[template]" // TODO: Make this settable in the TemplateEngine
      ));
    });

    if (options.unfoldSubNets) {
      // sub choreographies are "folded" into the main choreography, i.e.,
      // they are treated as visual option only with no consequence for the generated contract
      this.unfoldSubNets(iNet); // TODO: Recursively unfold all subnets
    }

    this.encodeNets(encoded.id, iNet, encoded);
    return encoded;
  }

  private static encodeNets(
    parent_id: number, // 0 if main choreography
    iNet: InteractionNet, 
    encoded: Encoding.MainProcess
  ) {
    // optimisation step by removing silent transitions
    // we need to first unfold subnets, so they're also optimised correctly
    this.removeSilentTransitions(iNet);
    this.encodeTransitions(iNet, encoded);

    for (const subNet of iNet.subNets.values()) {
      // optimisation step by removing silent transitions
      this.removeSilentTransitions(subNet);

      const subNetTransition = iNet.elements.get(subNet.id) as Transition;
      if (!subNetTransition)
        throw new Error(`sub net (ID: ${subNet.id}) with no corresponding transition in parent net (ID: ${iNet.id}) found`);

      const encodedID = encoded.subProcesses.size;
      const subProcess = new Encoding.Process(encodedID, subNet.id);
      for (const parID of subNet.participants.keys()) {
        if (!encoded.participants.has(parID))
          throw new Error(`participant (ID: ${parID}) in sub net (ID: ${subNet.id}) with no corresponding participant in parent net (ID: ${iNet.id}) found`);
        subProcess.participants.set(parID, encoded.participants.get(parID)!)
      }

      this.encodeTransitions(iNet, subProcess)
      this.encodeSubNetTransition(parent_id, subProcess, subNetTransition);

      encoded.subProcesses.set(subNet.id, subProcess);
      if (subNet.subNets.size > 0) {
        this.encodeNets(encodedID, subNet, encoded);
      } else {
        return;
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

  /**
   * Encodes the transitions of an InteractionNet into an Encoding.Process.
   *
   * @param iNet - The InteractionNet to encode.
   * @param encoded - The Encoding.Process to store the encoded transitions.
   * @throws {Error} If the InteractionNet is invalid or contains unconnected transitions.
   * @returns The encoded transitions.
   */
  private static encodeTransitions(
    iNet: InteractionNet, 
    encoded: Encoding.Process
  ) {
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    // transitions to ids
    const taskIDs = new Map<string, number>();
    const transitions = new Array<Transition>();

    for (const element of iNet.elements.values()) {
      if (!(element instanceof Transition) || this.isSubOrCallChoreography(element)) { // don't need extra IDs for other choreos
        continue;
      }
      if (element.source.length === 0 && element.target.length === 0) {
        throw new Error(`Unconnected transition in interaction net ${element.id}`);
      }
      if (!this.isSilentTransition(element)) {  // silent transitions don't need external IDs
        taskIDs.set(element.id, taskIDs.size + 1); // keep 0 for noop
      }
      transitions.push(element);
    }

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
        encoded.addTransition(element.id, new Encoding.Transition({
          consume, produce, condition, isEnd, defaultBranch
        }));
      }
      else if (element.label instanceof TaskLabel) {
        encoded.addTransition(element.id, new Encoding.InitiatedTransition({
          modelID: element.id,
          initiatorID: encoded.participants.get(element.label.sender.id)!.id,
          taskID: taskIDs.get(element.id)!,
          taskName: element.label.name,
          consume, produce, condition, isEnd, defaultBranch,
        }));
      }
    }
  }

  static encodeSubNetTransition(
    parent_id: number, 
    encoded: Encoding.Process, 
    subNetTransition: Transition) {
    
    
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

  /**
   * Assure source and target are connected through one place and source doesn't have other targets and target doesn't have other sources
   * Includes rule a, b, e, f.1, h
   */
  private static removeSilentTransitionCaseA(iNet: InteractionNet, prevElement: Element, element: Element, nextElement: Element) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (prevElement.target.length !== 1 || nextElement.source.length !== 1) return;
    assert(element instanceof Place);
    if (this.isSilentTransition(prevElement)) {
      this.mergeSourceIntoTarget(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    } else if (this.isSilentTransition(nextElement)) {
      this.mergeTargetIntoSource(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    }
    return false;
  }

  private static removeSilentTransitionCaseB(iNet: InteractionNet, prevElement: Element, element: Element, nextElement: Element) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (!this.isSilentTransition(prevElement) || !this.isSilentTransition(nextElement)) return;
    assert(element instanceof Place);
    if (prevElement.target.length > 1 && nextElement.source.length === 1) { // rule f.2
      this.mergeTargetIntoSource(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    } else if (prevElement.target.length === 1 && nextElement.source.length > 1) { // rule g
      this.mergeSourceIntoTarget(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    }
    return false;
  }

  private static removeSilentTransitionCaseC(iNet: InteractionNet, prevElement: Element, element: Element, nextElement: Element) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (!this.isSilentTransition(element)) return;
    assert(element instanceof Transition);

    if (prevElement.target.length > 1 && nextElement.source.length === 1) { // rule c
      this.mergeSourceIntoTarget(iNet, prevElement, nextElement);
      this.copyProperties(element as Transition, nextElement.target as Transition[]);
      this.deleteElement(iNet, element);
      return true;
    } else if (prevElement.target.length === 1 && nextElement.source.length > 1) { // rule d
      this.mergeTargetIntoSource(iNet, prevElement, nextElement);
      this.copyProperties(element as Transition, prevElement.source as Transition[]);
      this.deleteElement(iNet, element);
      return true;
    }
    return false;
  }

  // rule i
  private static removeSilentTransitionCaseD(iNet: InteractionNet, prevElement: Element, element: Element, nextElement: Element) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (!this.isSilentTransition(element)) return;
    assert(element instanceof Transition);

    if (this.isSilentTransition(element) // rule i
      && element.source.length === 1 && element.target.length > 1
      && element.source[0].source.length > 0 && element.source[0].target.length > 1
      ) {
      // XOR -> AND, XOR not immediately after start event (a manual task is present before the XOR)
      const xorPlace = element.source[0];
      const andPlaces = element.target;
      for (const prevTransition of xorPlace.source) this.linkNewTargets(prevTransition, andPlaces);
      for (const andPlace of andPlaces) this.linkNewTargets(andPlace, xorPlace.target);
      this.deleteElement(iNet, element);
      this.deleteElement(iNet, xorPlace); 
      return true;
    }
    return false;
  }

  private static mergeSourceIntoTarget(iNet: InteractionNet, source: Element, target: Element) {
    this.linkNewSources(target, source.source);
    if (source instanceof Transition) this.copyProperties(source, [target as Transition]);
    this.deleteElement(iNet, source);
  }

  private static mergeTargetIntoSource(iNet: InteractionNet, source: Element, target: Element) {
    this.linkNewTargets(source, target.target);
    if (target instanceof Transition) this.copyProperties(target, [source as Transition]);
    this.deleteElement(iNet, target);
  }

  private static removeSilentTransitions(iNet: InteractionNet) {
    for (const element of iNet.elements.values()) {
      if (element.source.length === 1 && element.target.length === 1) {
        const prevElement = element.source[0];
        const nextElement = element.target[0];
        
        if (this.removeSilentTransitionCaseA(iNet, prevElement, element, nextElement)) continue;
        if (this.removeSilentTransitionCaseB(iNet, prevElement, element, nextElement)) continue;
        if (this.removeSilentTransitionCaseC(iNet, prevElement, element, nextElement)) continue;
        if (this.removeSilentTransitionCaseD(iNet, prevElement, element, nextElement)) continue;
      }
    }
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

  static isSubOrCallChoreography(el: Transition) {
    return el instanceof Transition && el.label instanceof TaskLabel &&
    (   el.label.taskType === TaskType.CallChoreography 
    ||  el.label.taskType === TaskType.SubChoreography );
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