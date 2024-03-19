/**
 * Generates a conformance check solidity contract from an interaction petri net.
 * A manual transition can be enacted when the conditions for it are met, i.e.,
 * the task is enabled and the correct participant is calling.
 * An Autonomous transition is performed by the smart contract automatically as soon as 
 * the conditions are met. The conditions are checked after a manual transition is attempted.
 */
import { deleteFromArray } from '../helpers';
import { Transition, Element, TaskLabel, LabelType, Place, PlaceType } from '../Parser/Element';
import InteractionNet from '../Parser/InteractionNet';
import Participant from '../Parser/Participant';

export type Options = {
  // all string types, as number = 0 is interpreted as false value
  // and may be not displayed by the template engine
  numberOfParticipants: string,
  hasConditions: boolean,
  hasManualTransitions: boolean,
  hasAutonomousTransitions: boolean,
  manualTransitions: Array<{
    id: string,
    initiator: string|null,
    consume: string,
    produce: string,
    // condition is a number as 0 = default condition, which doesn't
    // have to appear
    condition: number,
    isEnd: boolean
  }>
  autonomousTransitions: Array<{
    consume: string,
    produce: string,
    condition: number,
    isEnd: boolean
  }>
}

export default class ProcessGenerator {

  static generate(_iNet: InteractionNet, _options?: any): 
  { taskIDs: Map<string, number>; conditionIDs: Map<string, number>, participants: Participant[]; options: Options; } 
  {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    const options: Options = _options ? _options : {}

    options.numberOfParticipants = iNet.participants.size.toString();
    options.manualTransitions = new Array();
    options.autonomousTransitions = new Array();
    options.hasConditions = false; // overriden in case flow guards are encountered
    options.hasManualTransitions = false;
    options.hasAutonomousTransitions = false;
    const participants = [...iNet.participants.values()];

    // remove silent transitions
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
      } else if (element.source.length === 1 && element.target.length > 1
        && this.isSilentTransition(element)) {
          // XOR -> AND
          const source = element.source[0];
          for (const andPlace of element.target) {
            this.linkNewTargets(andPlace, source.target);
            this.linkNewSources(andPlace, source.source);
          }
          this.deleteElement(iNet, element);
          this.deleteElement(iNet, source);
      }
    }

    // places to transition markings
    const transitionMarkings = new Map<string, number>();
    let transitionCounter = 0;
    // guards to condition markings
    let conditionCounter = 0;
    // transitions to ids
    const taskIDs = new Map<string, number>();
    const conditionIDs = new Map<string, number>();

    for (const element of iNet.elements.values()) {
      if (!(element instanceof Transition)) {
        continue;
      }
      if (element instanceof Transition 
        && !this.isSilentTransition(element)) {
          taskIDs.set(element.id, taskIDs.size);
      }

      // assign condition to transition
      let condition = 0;
      if (element.label.guards.size > 0) {
        // filter out default flows
        const conditions = [...element.label.guards].filter(([_, guard]) => {
          return guard.default === false;
        })

        if (conditions.length > 0) {
          const el = [...element.label.guards.entries()].pop()!;
          let string = el[1].name + ` (${el[0]})`;

          if (conditions.length > 1) {
            element.label.guards.forEach((guard, id) => {
              if (!guard.default)
                string += `AND ${guard.name} (${id})`
            });
          }
          condition = 2 ** conditionCounter;
          conditionCounter++;
          conditionIDs.set(string, conditionIDs.size);
        }
      }

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
          transitionMarkings.set(out.id, 0);
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
        options.autonomousTransitions.push({
          consume: consume.toString(), 
          produce: produce.toString(),
          condition,
          isEnd
        });
      }
      else if (element.label instanceof TaskLabel) {
        options.manualTransitions.push({
          id: taskIDs.get(element.id)!.toString(),
          initiator: participants.indexOf(element.label.sender).toString(),
          consume: consume.toString(),
          produce: produce.toString(),
          condition,
          isEnd
        });
      }
    }
    

    options.hasManualTransitions = options.manualTransitions.length > 0;
    options.hasAutonomousTransitions = options.autonomousTransitions.length > 0;
    options.hasConditions = conditionIDs.size > 0;

    return { taskIDs, conditionIDs, participants, options };
  }

  private static isSilentTransition(el: Element) {
    return el instanceof Transition &&
    (el.label.type === LabelType.ExclusiveIncoming
    || el.label.type === LabelType.ExclusiveOutgoing
    || el.label.type === LabelType.ParallelConverging
    || el.label.type === LabelType.ParallelDiverging
    || el.label.type === LabelType.Start
    || el.label.type === LabelType.End);
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

  private static copyProperties(copyFrom: Transition, copyTo: Transition[]) {
    // copy gateway guards
    if (copyFrom.label.guards.size === 0) {
      return;
    }
    for (const transition of copyTo) {
      transition.label.guards = new Map([...copyFrom.label.guards, ...transition.label.guards]);
    }
  }

  static printReadme(
    tasks: Map<string, number>, 
    conditions: Map<string, number>, 
    participants: Participant[]) {

    let s = "";
    s += "# Readme\n";
    s += "## Participants are encoded as follows:\n";
    for (const i in participants)
      s += `- ${participants[i].id} with ID ${Number.parseInt(i)}\n`; 
    s += "\n";
    s += "## Tasks are encoded as follows:\n";
    for (const [k, i] of tasks) 
      s += `- ${k} with ID ${i}\n`; 
    s += "\n";
    if (conditions.size > 0) {
      s += "## Conditions are encoded as follows:\n";
      for (const [k, i] of conditions) 
        s += `- ${k} with ID ${i}\n`; 
      s += "\n";
    }
    return s;
  }
}