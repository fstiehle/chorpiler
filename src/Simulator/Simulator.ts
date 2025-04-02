import { INetEncoder } from "../Generator/Encoder";
import { Place, PlaceType, TaskLabel, Transition } from "../Parser/Element";
import { INetFastXMLParser } from "../Parser/FastXMLParser";
import { INetParser } from "../Parser/Parser";
import { XESFastXMLParser } from "../util/EventLog/XESFastXMLParser";
import { IXESParser } from "../util/EventLog/XESParser";
import { Event, InstanceDataChange } from "../util/EventLog/EventLog"
import fs from 'fs';
import path from 'path';
import Mustache from "mustache";

export interface ISimulator {
  prepare(): void;
  simulate(): void;
}

export class Simulator implements ISimulator {

  constructor(
    public bpmnDir: string = path.join(__dirname, "/data/bpmn"),
    public bpmnParser: INetParser = new INetFastXMLParser(),
    public xesDir: string = path.join(__dirname, "/data/xes"),
    public xesParser: IXESParser = new XESFastXMLParser(),
    public outputDir: string = path.join(__dirname, "/data/generated")
  ) {}

  private static traverse(element: Place | Transition, visited: Set<string>, taskList: string[]): string[] {

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
      if (element.type === PlaceType.End) {
        taskList.push("End");
        return taskList;
      }
    }

    for (const target of element.target) {
      return Simulator.traverse(target, visited, taskList);
    }

    return taskList;
  }

  async prepare(): Promise<void> {

    const bpmnFiles = fs.readdirSync(this.bpmnDir).filter(file => file.endsWith('.bpmn'));
    const xesFiles = fs.readdirSync(this.xesDir).filter(file => file.endsWith('.xes'));

    for (const file of bpmnFiles) {
      console.log(file)
      const filePath = path.join(this.bpmnDir, file);
      const model = fs.readFileSync(filePath);
      const nets = await this.bpmnParser!.fromXML(model);
      const iNet = nets[0]; // only support one model

      const xesFile = xesFiles.find(xes => xes.startsWith(path.basename(file, '.bpmn')));
      if (!xesFile) {
        throw new Error(`No corresponding .xes file found for ${file}`);
      }

      const xesContent = fs.readFileSync(path.join(this.xesDir, xesFile));
      const log = await this.xesParser!.fromXML(xesContent);

      const encoder = new INetEncoder();
      const net = encoder.removeSilentTransitions(iNet);

      // find XOR gateways and match participants
      const gatewayTasks = new Map<string, string[]>();
      const taskParticipants = new Map<string, { from: string, to: string[] }>();
      for (const element of net.elements.values()) {
        if (!(element instanceof Transition)) continue;
        const condition = Simulator.getCondition(element);
        if (condition) 
          gatewayTasks.set(condition, Simulator.traverse(element, new Set(), []));
        if (element.label instanceof TaskLabel)
          taskParticipants.set(element.label.name, { 
            from: element.label.sender.id, 
            to: element.label.receiver.map(t => t.id) 
          })
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
            }
            if (eventName.includes("End")) {
              console.log(`Add Gateway: ${gateway} to end of the log`);
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

      const template = fs.readFileSync(path.join(__dirname, "./templates/xes", "log.mustache.xes"), "utf-8");
      const renderedLog = Mustache.render(template, log);

      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      const outputFilePath = path.join(this.outputDir, `${path.basename(file, '.bpmn')}.xes`);
      fs.writeFileSync(outputFilePath, renderedLog, "utf-8");
      console.log(`Generated log written to ${outputFilePath}`);
    }
  }

  private static getCondition(transition: Transition) {
    if (transition.label.guards.size > 0) {
      const conditions = [];
      for (const guard of transition.label.guards.values()) {
        if (guard.condition) conditions.push(guard.condition);
      }
      if (conditions.length > 0) return conditions.join(" && ");
    }
  }

  simulate(): void {
    throw new Error("Method not implemented.");
  }

}