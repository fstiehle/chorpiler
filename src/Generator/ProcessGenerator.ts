/**
 * Generates a conformance check solidity contract from an interaction petri net.
 * A manual transition can be enacted when the conditions for it are met, i.e.,
 * the task is enabled and the correct participant is calling.
 * An Autonomous transition is performed by the smart contract automatically as soon as 
 * the conditions are met. The conditions are checked after a manual transition is attempted.
 */
import { deleteFromArray } from '../util/helpers';
import { Transition, Element, TaskLabel, LabelType, Place, PlaceType } from '../Parser/Element';
import { InteractionNet } from '../Parser/InteractionNet';
import { ProcessEncoding } from './ProcessEncoding';

export class TemplateOptions {
  // note: number = 0 is interpreted as false value
  // and may not be displayed by the template engine, 
  // thus, prefer string type
  numberOfParticipants = "0";
  participants = new Array<{
    id: string, // ID in form 0...n assigned by generator
    modelID: string, // ID as in model
    name: string,
    address: string
  }>();

  manualTransitions = new Array<{
    id: string,
    initiator: string|null,
    consume: string,
    produce: string,
    condition: string,
    isEnd: boolean
  }>();

  autonomousTransitions = Array<{
    consume: string,
    produce: string,
    condition: string,
    isEnd: boolean
  }>();

  hasConditions = false;
  hasManualTransitions = false;
  hasAutonomousTransitions = false;
}

export class ProcessGenerator {

  static generate(_iNet: InteractionNet): { encoding: ProcessEncoding; options: TemplateOptions; } 
  {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    const options = new TemplateOptions();

    // create participant options and IDs
    options.numberOfParticipants = iNet.participants.size.toString();
    const participantIDs = new Map<string, number>()
    for (let i = 0; i < iNet.participants.size; i++) {
      const par = [...iNet.participants.values()][i];
      participantIDs.set(par.id, i);
      options.participants.push({
        id: i.toString(),
        modelID: par.id,
        name: par.name,
        address: "[template]"
      })
    }

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
    // transitions to ids
    const taskIDs = new Map<string, number>();
    const conditionIDs = new Map<string, string>();

    for (const element of iNet.elements.values()) {
      if (!(element instanceof Transition)) {
        continue;
      }
      if (element instanceof Transition 
        && !this.isSilentTransition(element)) {
          taskIDs.set(element.id, taskIDs.size);
      }

      // build condition for transition
      let condition = "";
      if (element.label.guards.size > 0) {
        // filter out default flows
        const conditions = [...element.label.guards].filter(([_, guard]) => {
          return guard.default === false;
        })

        if (conditions.length > 0) {
          const el = [...element.label.guards.entries()].pop()!;
          let string = el[1].name + ` (${el[0]})`;
          console.log(el[1])
          condition = el[1].condition;

          if (conditions.length > 1) {
            condition = `(${condition}`;
            element.label.guards.forEach((guard, id) => {
              if (!guard.default)
                string += `AND ${guard.name} (${id})`
                condition += `&& ${guard.condition}`
            });
            condition = `${condition})`;
          }
          conditionIDs.set(string, condition);
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
          initiator: participantIDs.get(element.label.sender.id)!.toString(),
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

    return { encoding: new ProcessEncoding(taskIDs, conditionIDs, participantIDs), options };
  }

  private static isSilentTransition(el: Element) {
    return el instanceof Transition &&
    (el.label.type === LabelType.DataExclusiveIncoming
    || el.label.type === LabelType.DataExclusiveOutgoing
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
}