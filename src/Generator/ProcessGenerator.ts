/**
 * Generates a conformance check solidity contract from an interaction petri net.
 * A manual transition can be enacted when the conditions for it are met, i.e.,
 * the task is enabled and the correct participant is calling.
 * An Autonomous transition is performed by the smart contract automatically as soon as 
 * the conditions are met. The conditions are checked after a manual transition is attempted.
 */
import { deleteFromArray } from '../helpers';
import { Transition, Element, TaskLabel, LabelType, Place, PlaceType, Label } from '../Parser/Element';
import InteractionNet from '../Parser/InteractionNet';
import Participant from '../Parser/Participant';

export type Options = {
  enactmentVisibility: string,
  numberOfParticipants: string,
  manualTransitions: Array<{
    id: string,
    initiator: string|null,
    consume: string,
    produce: string,
    isEnd: boolean
  }>
  autonomousTransitions: Array<{
    consume: string,
    produce: string,
    isEnd: boolean
  }>
}

export default class ProcessGenerator {

  static generate(_iNet: InteractionNet, _options?: any): 
  { references: Map<string, number>; participants: Participant[]; options: Options; } 
  {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }

    const options: Options = _options ? _options : {
      enactmentVisibility: 'internal',
      numberOfParticipants: "",
      manualTransitions: new Array<{
        id: string,
        initiator: string|null,
        consume: string,
        produce: string
      }>(), 
      autonomousTransitions: new Array<{
        consume: string,
        produce: string,
        isEnd: boolean
      }>()
    } 

    options.numberOfParticipants = iNet.participants.size.toString();
    const participants = [...iNet.participants.values()];

    // remove silent transitions
    for (const element of iNet.elements.values()) {
      if (this.isSilent(element)) {
        const sourcePlace = element.source[0];
        const targetPlace = element.target[0];
        //console.log(sourcePlace, targetPlace);
        // a previous place only connected to this transition but with other previous transitions
        if (sourcePlace.target.length === 1 && sourcePlace.source.length > 0) {
          this.linkNewSources(targetPlace, sourcePlace.source);
          this.deleteElement(iNet, element);
          this.deleteElement(iNet, sourcePlace);
        // target place only connected to this transition but with other target transitions
        } else if (targetPlace.source.length === 1 && targetPlace.target.length > 0) {
          this.linkNewTargets(sourcePlace, targetPlace.target);
          this.deleteElement(iNet, element);
          this.deleteElement(iNet, targetPlace);
        }
      }
    }

    // places to marking ids
    const markings = new Map<string, number>();
    let markingCounter = 0;
    // transitions to ids
    const references = new Map<string, number>();
    let referenceCounter = 0;

    for (const element of iNet.elements.values()) {
      if (!(element instanceof Transition)) {
        continue;
      }
      if (element instanceof Transition 
        && !this.isSilent(element)
        && !references.get(element.id)) {
        references.set(element.id, referenceCounter);
        referenceCounter++;
      }
      // console.log("ID", references.get(element.id));
      let consume = 0;
      let produce = 0;
      // console.log("EID", element.id);
      // collect consuming places
      // console.log("INS____");
      for (const _in of element.source) {
        // console.log(_in);
        if (!markings.get(_in.id)) {
          markings.set(_in.id, 2 ** markingCounter);
          markingCounter++;
        }
        consume += markings.get(_in.id)!;
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
          markings.set(out.id, 0);

        } else if (!markings.get(out.id)) {
          markings.set(out.id, 2 ** markingCounter);
          markingCounter++;
        }
        produce += markings.get(out.id)!;
        // console.log(produce)
      }

      // silent elements don't need an ID
      if (this.isSilent(element)) {
        options.autonomousTransitions.push({
          consume: consume.toString(), 
          produce: produce.toString(),
          isEnd
        });
      } else {
        options.manualTransitions.push({
          id: references.get(element.id)!.toString(),
          initiator: element.label instanceof TaskLabel ? participants.indexOf(element.label.sender).toString(): null,
          consume: consume.toString(),
          produce: produce.toString(),
          isEnd
        });
      }
    }
    //console.log(options);
    //console.log(markings);
    //this.printReadme(references, participants);
    return { references, participants, options };
  }

  private static isSilent(el: Element) {
    return el instanceof Transition &&
    (el.label.type === LabelType.ExclusiveGateway
    || el.label.type === LabelType.Start
    || el.label.type === LabelType.End
    );
  }

  private static deleteElement(iNet: InteractionNet, el: Element) {
    for (const source of el.source)
      deleteFromArray(source.target, el);
    for (const target of el.target)
      deleteFromArray(target.source, el);
    iNet.elements.delete(el.id);
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

  static printReadme(references: Map<string, number>, participants: Participant[]) {
    let s = "";
    s += "# Readme\n";
    s += "## Tasks are encoded as follows:\n";
    for (const [k, i] of references) 
      s += `- ${k} with ID ${i}\n`; 
    s += "\n"
    s += "## Participants are encoded as follows:\n"
    for (const i in participants)
      s += `- ${participants[i].id} with ID ${Number.parseInt(i)}\n`; 
    s += "\n"
    return s;
  }
}