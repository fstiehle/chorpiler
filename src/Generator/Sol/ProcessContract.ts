/**
 * Generates a conformance check solidity contract from an interaction petri net.
 * A manual transition can be enacted when the conditions for it are met, i.e.,
 * the task is enabled and the correct participant is calling.
 * An Autonomous transition is performed by the smart contract automatically as soon as 
 * the conditions are met. The conditions are checked after a manual transition is attempted.
 */
import Mustache from 'mustache';
import { deleteFromArray } from '../../helpers';
import { Transition, Element, TaskLabel, LabelType } from '../../Parser/Element';
import InteractionNet from '../../Parser/InteractionNet';
import Participant from '../../Parser/Participant';
import TemplateEngine from '../TemplateEngine';
import util from 'util';
import * as fs from 'fs';
import path from 'path';

const readFile = util.promisify(fs.readFile);

const ManualEnactment = [
  LabelType.Task
]
const AutonomousEnactment = [
  LabelType.End,
  // TODO: Fix Bug, LabelType.ExclusiveGateway
]

type Options = {
  enactmentVisibility: string,
  numberOfParticipants: string,
  manualTransitions: Array<{
    id: string,
    initiator: string|null,
    consume: string,
    produce: string
  }>
  autonomousTransitions: Array<{
    consume: string,
    produce: string
  }>
}

export class SolidityProcess implements TemplateEngine {

  async getTemplate(): Promise<string> {
    return (await readFile(path.join(__dirname, '..', 'templates/Process.sol'))).toString();
  }

  async compile(_iNet: InteractionNet, _template?: string, _options?: Options): Promise<string> {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    const template: string = _template ? _template : await this.getTemplate();
  
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
        produce: string
      }>()
    }  

    options.numberOfParticipants = iNet.participants.size.toString();
    const participants = [...iNet.participants.values()];

    // remove start transition, as we assume the init of a contract
    // is equal firing the start transition
    this.deleteElement(iNet, iNet.initial);
    this.deleteElement(iNet, iNet.initial.target[0]);
    iNet.initial = iNet.initial.target[0].target[0];

    // remove silent transitions generated by XOR transformations
    for (const element of iNet.elements.values()) {
      if (element instanceof Transition 
        && element.label.type === LabelType.ExclusiveGateway) {
        // console.log(element.id); console.log(element.source); console.log(element.target);
        if (element.target[0].target.length === 1 
          && element.target[0].target.length < element.target[0].source.length) {
          // converging
          const sourcePlace = element.source[0];
          const targetPlace = element.target[0];
          const prevTransitions = sourcePlace.source;
          this.linkM1(targetPlace, prevTransitions);
          // if the source place has other targets,
          // re-link also before deletion
          this.link1M(targetPlace, sourcePlace.target);
          this.deleteElement(iNet, sourcePlace);
          this.deleteElement(iNet, element);
        } else {
          // diverging
          const sourcePlace = element.source[0];
          const targetPlace = element.target[0];
          const nextTransitions = targetPlace.target; 
          this.link1M(sourcePlace, nextTransitions);
          // if the source place has other sources,
          // re-link also before deletion
          this.linkM1(sourcePlace, targetPlace.source);
          this.deleteElement(iNet, targetPlace);
          this.deleteElement(iNet, element);
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
        && ManualEnactment.includes(element.label.type)
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
      for (const out of element.target) {
        // console.log(out);
        if (!markings.get(out.id)) {
          markings.set(out.id, 2 ** markingCounter);
          markingCounter++;
        }
        produce += markings.get(out.id)!;
        // console.log(produce)
      }

      // automatically enacted elements don't need an ID
      if (AutonomousEnactment.includes(element.label.type)) {
        options.autonomousTransitions.push({
          consume: consume.toString(), 
          produce: produce.toString()
        });
      } else if (ManualEnactment.includes(element.label.type)) {
        options.manualTransitions.push({
          id: references.get(element.id)!.toString(),
          initiator: element.label instanceof TaskLabel ? participants.indexOf(element.label.sender).toString(): null,
          consume: consume.toString(),
          produce: produce.toString()
        });
      } else {
        console.warn("Unsupported Element, skip", element.id);
      }
    }
    //console.log(options);
    //console.log(markings);
    this.printReadme(references, participants);
    return Mustache.render(template, options);
  }

  private deleteElement(iNet: InteractionNet, el: Element) {
    for (const source of el.source)
      deleteFromArray(source.target, el);
    for (const target of el.target)
      deleteFromArray(target.source, el);
    iNet.elements.delete(el.id);
  }

  private linkM1(el: Element, elements: Element[]) {
    el.source.push(...elements);
    for (const transition of elements)
      transition.target.push(el);
  }

  private link1M(el: Element, elements: Element[]) {
    for (const transition of elements)
      transition.source.push(el);
    el.target.push(...elements);
  }

  private printReadme(references: Map<string, number>, participants: Participant[]) {
    console.log("# Readme");
    console.log("## Tasks are encoded as follows:");
    for (const [k, i] of references) 
      console.log("-", k, "with ID", i); 
    console.log();
    console.log("## Participants are encoded as follows:");
    for (const i in participants)
      console.log("-", participants[i].id, "with ID", Number.parseInt(i)); 
    console.log();
  }
}

export { TemplateEngine };
