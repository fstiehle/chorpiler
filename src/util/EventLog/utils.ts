import { INetEncoder } from "../../Generator/Encoder"
import { Transition, Place, TaskLabel, PlaceType } from "../../Parser/Element"
import { InteractionNet } from "../../Parser/InteractionNet"
import { Event, EventLog, InstanceDataChange } from "./EventLog"

/**
 * Given an EventLog and a net, insert data based decisions at the appropriate point
 */
export const disperseCaseDataInLog = (log: EventLog, _net: InteractionNet) => {
  const traverse = (
    element: Place | Transition,
    visited: Set<string>,
    taskList: string[]
  ): string[] => {

    if (visited.has(element.id)) {
      return taskList; // Prevent infinite loops by skipping already visited elements
    }

    visited.add(element.id); // Mark the element as visited
    if (element instanceof Transition) {
      if (element.label instanceof TaskLabel) {
        taskList.push(element.label.name);
        return taskList;
      } 
    } else if (element instanceof Place) {
      // TODO: If element is start
      if (element.type === PlaceType.Start) {
        taskList.push("Start");
        return taskList;
      }
    }

    for (const source of element.source) {
      return traverse(source, visited, taskList);
    }

    return taskList;
  };

  const getCondition = (transition: Transition) => {
    if (transition.label.guards.size > 0) {
      const conditions = [];
      for (const guard of transition.label.guards.values()) {
        if (guard.condition) conditions.push(guard.condition);
      }
      if (conditions.length > 0) return conditions.join(" && ");
    }
  }

  const encoder = new INetEncoder();
  const net = encoder.removeSilentTransitions(_net);

  // find XOR gateways and match participants
  const gatewayTasks = new Map<string, string[]>();
  const taskParticipants = new Map<string, { from: string, to: string[] }>();
  for (const element of net.elements.values()) {
    if (!(element instanceof Transition)) continue;
    const condition = getCondition(element);
    if (condition) 
      gatewayTasks.set(condition, traverse(element, new Set(), []));
    if (element.label instanceof TaskLabel)
      taskParticipants.set(element.label.name, { from: element.label.sender.id, to: element.label.receiver.map(t => t.id) })
  }

  for (const trace of log.traces) {
    // Traverse the trace starting from the end
    for (let i = trace.events.length - 1; i >= 0; i--) {
      const entry = trace.events[i];
      entry.source = taskParticipants.get(entry.name)!.from;

      for (const [gateway, eventName] of gatewayTasks.entries()) {
        if (eventName.includes(entry.name)) {
          console.log(`Matched gateway: ${gateway} for event: ${entry.name}`);
          trace.events.splice(i, 0, new Event(
            "data change",
            "Participant 0",
            undefined,
            [new InstanceDataChange(`cond[${gateway}]`, true)]
          ));
        } else if (i === 0 && eventName.includes("Start")) {
          console.log(`Add Gateway: ${gateway} to start of the log`);
          trace.events.splice(i, 0, new Event(
            "data change",
            "Participant 0",
            undefined,
            [new InstanceDataChange(`cond[${gateway}]`, true)]
          ));
        }
      }
    }
  }
}