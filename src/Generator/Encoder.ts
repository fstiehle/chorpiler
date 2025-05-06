/**
 * Generates a Encoding from an INet, by removing silent transitions and encoding tasks in a bit array fashion, 
 * the template can be used to render the process token play by a TemplateEngine
 */
import { deleteFromArray, printInet } from '../util/helpers';
import { Transition, Element, TaskLabel, LabelType, Place, PlaceType, Guard, SubChoreographyTaskLabel } from '../Parser/Element';
import { InteractionNet } from '../Parser/InteractionNet';
import * as Encoding from "./Encoding/Encoding";
import { assert } from 'console';

export class INetEncoder {

  private mainEncoded = new Encoding.MainProcess();
  
  public generate(
    _iNet: InteractionNet, 
    options: { unfoldSubNets: boolean } // If true,
    // sub choreographies are "folded" into the main choreography, i.e.,
    // they are treated as visual option only with no consequence for the generated contract
  ) {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    this.mainEncoded.modelID = iNet.id;
    // create participant template options and IDs
    [...iNet.participants.values()].forEach((par, encodedID) => {
      this.mainEncoded.participants.set(par.id, new Encoding.Participant(
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

    this.encodeNets(this.mainEncoded, iNet);
    return this.mainEncoded;
  }

  private encodeNets(
    parent: Encoding.Process,
    iNet: InteractionNet
  ) {
    // encode all subnets before transforming (i.e., reducing) the interaction net to preserve subnet position
    for (const subNet of iNet.subNets.values()) {
      const subNetTransition = iNet.elements.get(subNet.id) as Transition;
      if (!subNetTransition)
        throw new Error(`sub net (ID: ${subNet.id}) with no corresponding transition in parent net (ID: ${iNet.id}) found`);

      const subEncoding = new Encoding.SubProcess(this.mainEncoded.subProcesses.size + 1);
      subEncoding.modelID = subNet.id;
      // record place of subnet transition
      for (const outplace of subNetTransition.target) for (const t of outplace.target) subEncoding.targetIDs.push(t.id);
      for (const inPlace of subNetTransition.source) for (const t of inPlace.source) subEncoding.sourceIDs.push(t.id);
      this.deleteElement(iNet, subNetTransition);

      // parse subnet participants from mainnet
      for (const parID of subNet.participants.keys()) {
        if (!this.mainEncoded.participants.has(parID))
          throw new Error(`participant (ID: ${parID}) in sub net (ID: ${subNet.id}) with no corresponding participant in parent net (ID: ${iNet.id}) found`);
        subEncoding.participants.set(parID, this.mainEncoded.participants.get(parID)!)
      }
      this.mainEncoded.subProcesses.set(subEncoding.modelID, subEncoding);
    }

    this.removeSilentTransitions(iNet);
    this.encodeTransitions(iNet, parent);

    // transform and encode subnet
    for (const subNet of iNet.subNets.values()) {
      const subEncoding = this.mainEncoded.subProcesses.get(subNet.id)!;
      this.removeSilentTransitions(subNet);
      this.encodeTransitions(subNet, subEncoding)
      this.encodeSubNetTransition(subNet, parent, subEncoding);

      if (subNet.subNets.size > 0) {
        this.encodeNets(subEncoding, subNet);
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
  private unfoldSubNets(iNet: InteractionNet) {
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
  private encodeTransitions(
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
      if (!(element instanceof Transition)) { // don't need extra IDs for other choreos
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

  private encodeSubNetTransition(
    subNet: InteractionNet,
    parent_process: Encoding.Process, 
    subEncoded: Encoding.SubProcess) {

    const sources = subEncoded.sourceIDs;
    // calculate produce of end event of subnet
    let produce = 0;
    for (const id of sources) {
      produce += parent_process.transitions.get(id)!.produce;
      // set outTo of parent net transition activating the subprocess
      parent_process.transitions.get(id)!.outTo = { id: subEncoded.id, produce: 1 } 
    }
    // set end event outTo
    for (const beforeEnd of subNet.end!.source)
      subEncoded.transitions.get(beforeEnd.id)!.outTo = { id: parent_process.id, produce };
  }

  private buildCondition(guardsMap: Map<string, Guard>) {
    let condition = "";
    let defaultBranch = false;

    const guards = [...guardsMap.values()]
    console.log(guards)
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
  private removeSilentTransitionCaseA(iNet: InteractionNet, prevElement: Element, element: Element, nextElement: Element) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (prevElement.target.length !== 1 || nextElement.source.length !== 1) return;
    if (!(element instanceof Place)) return;

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

  private removeSilentTransitionCaseB(iNet: InteractionNet, prevElement: Element, element: Element, nextElement: Element) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (!this.isSilentTransition(prevElement) || !this.isSilentTransition(nextElement)) return;
    if (!(element instanceof Place)) return;

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

  private removeSilentTransitionCaseC(iNet: InteractionNet, prevElement: Element, element: Element, nextElement: Element) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (!this.isSilentTransition(element)) return;
    assert(element instanceof Transition);
    if (prevElement.target.length > 1 && nextElement.source.length === 1) { // rule c
      this.copyProperties(element as Transition, nextElement.target as Transition[]);
      this.mergeTargetIntoSource(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    } else if (prevElement.target.length === 1 && nextElement.source.length > 1) { // rule d
      this.copyProperties(element as Transition, prevElement.source as Transition[]);
      this.mergeSourceIntoTarget(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    }
    return false;
  }

  // rule i
  private removeSilentTransitionCaseD(iNet: InteractionNet, prevElement: Element, element: Element, nextElement: Element) {
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

  private mergeSourceIntoTarget(iNet: InteractionNet, source: Element, target: Element) {
    this.linkNewSources(target, source.source);
    if (source instanceof Transition) this.copyProperties(source, [target as Transition]);
    this.deleteElement(iNet, source);
  }

  private mergeTargetIntoSource(iNet: InteractionNet, source: Element, target: Element) {
    this.linkNewTargets(source, target.target);
    if (target instanceof Transition) this.copyProperties(target, [source as Transition]);
    this.deleteElement(iNet, target);
  }

  public removeSilentTransitions(iNet: InteractionNet) {
    for (const element of iNet.elements.values()) {
      if (element.source.length === 1 && element.target.length === 1) {
        const prevElement = element.source[0];
        const nextElement = element.target[0];
        if ((element instanceof Place)) {
          if (this.removeSilentTransitionCaseA(iNet, prevElement, element, nextElement)) continue;
          if (this.removeSilentTransitionCaseB(iNet, prevElement, element, nextElement)) continue;
        } else {
          if (this.removeSilentTransitionCaseC(iNet, prevElement, element, nextElement)) continue;
          if (this.removeSilentTransitionCaseD(iNet, prevElement, element, nextElement)) continue;
        }
      }
    }
    return iNet;
  }

  private isSilentTransition(el: Element) {
    return el instanceof Transition &&
    (  el.label.type === LabelType.DataExclusiveIncoming
    || el.label.type === LabelType.DataExclusiveOutgoing
    || el.label.type === LabelType.EventExclusiveIncoming
    || el.label.type === LabelType.EventExclusiveOutgoing
    || el.label.type === LabelType.ParallelConverging
    || el.label.type === LabelType.ParallelDiverging
    || el.label.type === LabelType.Start
    || el.label.type === LabelType.End
    || this.isSubOrCallChoreographyTask(el) );
  }

  private isSubOrCallChoreographyTask(el: Transition) {
    return el instanceof Transition && el.label instanceof SubChoreographyTaskLabel;
  }

  private deleteElement(iNet: InteractionNet, el: Element) {
    this.unlinkAllSources(el);
    this.unlinkAllTargets(el);
    iNet.elements.delete(el.id);
  }

  private unlinkAllSources(el: Element) {
    if(el.source.length === 0) return;
    for (const source of el.source)
      deleteFromArray(source.target, el);
    el.source = new Array();
  }

  private unlinkAllTargets(el: Element) {
    if (el.target.length === 0) return;
    for (const target of el.target)
      deleteFromArray(target.source, el);
    el.target = new Array();
  }

  private linkNewSources(el: Element, sources: Element[]) {
    el.source.push(...sources);
    for (const transition of sources)
      transition.target.push(el);
  }

  private linkNewTargets(el: Element, targets: Element[]) {
    el.target.push(...targets);
    for (const transition of targets)
      transition.source.push(el);
  }

  private copyProperties(copyFrom: Transition, copyTo: Transition[]) {
    if (copyFrom.label.guards.size !== 0) {
      for (const transition of copyTo) {
        // copy gateway guards
        transition.label.guards = new Map([...copyFrom.label.guards, ...transition.label.guards]);
      }
    }
    // adjust subnet source and target if necessary
    for (const subNet of this.mainEncoded.subProcesses.values()) {
      if (subNet.sourceIDs.includes(copyFrom.id)) {
        deleteFromArray(subNet.sourceIDs, copyFrom.id);
        subNet.sourceIDs.push(...copyTo.map(t => t.id))
      }
    } 
  }
}