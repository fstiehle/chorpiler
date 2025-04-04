import { INetEncoder } from "../Generator/Encoder";
import { Element, Place, PlaceType, TaskLabel, Transition } from "../Parser/Element";
import { INetFastXMLParser } from "../Parser/FastXMLParser";
import { INetParser } from "../Parser/Parser";
import { XESFastXMLParser } from "../util/EventLog/XESFastXMLParser";
import { IXESParser } from "../util/EventLog/XESParser";
import { Event, EventLog, InstanceDataChange } from "../util/EventLog/EventLog"
import fs from 'fs';
import path from 'path';
import Mustache from "mustache";
import { InteractionNet } from "../Parser/InteractionNet";
import { Trace } from "../util/EventLog/Trace";

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

  /* private static traverse(element: Place | Transition, visited: Set<string>, taskList: string[]): string[] {

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
  } */

  private static Simulation = class {
    public traces = new Array<Trace>();
    public visited = new Array<string[]>();
    public conditions = new Map<number, string>();

    constructor(private iNet: InteractionNet) {}

    prepare() {
      this.replay2(this.iNet.initial!, [], new Trace([]))
    }

    replay2(current: Place, visited: string[], trace: Trace) {
      if (current.type === PlaceType.End) {
        this.visited.push([...visited]); // reached end, deep copy
        this.traces.push(new Trace([...trace.events])); // reached end, deep copy
        return;
      }

      for (const transition of current.target) {
        // Check if transition is enabled
        if (transition.source.every(p => visited.includes(p.id) || p.id === current.id)) {
          // Fire transition
          visited.push(transition.id);
          const cond = this.getCondition(transition)
          if (cond) {
            const condID = this.conditions.size;
            this.conditions.set(condID, cond);  
            // add instance data change
            trace.events.push(new Event(
              "Instance Data Change",
              "Participant",
              "",
              [new InstanceDataChange(`conditions[${condID}]`, true)]
            ));
          }
          if (transition.label instanceof TaskLabel) {      
            trace.events.push(new Event(
              transition.label.name,
              transition.label.sender.id
            ));
          }
          for (const nextPlace of transition.target) {
            this.replay2(nextPlace, visited, trace);
          }

          visited.pop(); // backtrack (XOR fork)
          if (transition.label instanceof TaskLabel) {  
            trace.events.pop()
          }
          if (cond) { 
            trace.events.pop()
          }
        }
      }
    }

    private getCondition(transition: Transition) {
      if (transition.label.guards.size > 0) {
        const conditions = [];
        for (const guard of transition.label.guards.values()) {
          if (guard.condition && !guard.default) conditions.push(guard.condition);
        }
        if (conditions.length > 0) return conditions.join(" && ");
      }
    }
  }

  async prepare(): Promise<void> {

    const bpmnFiles = fs.readdirSync(this.bpmnDir).filter(file => file.endsWith('.bpmn'));

    for (const file of bpmnFiles) {
      console.log(file)
      const filePath = path.join(this.bpmnDir, file);
      const model = fs.readFileSync(filePath);
      const nets = await this.bpmnParser!.fromXML(model);
      const iNet = nets[0]; // only support one model

      const simu = new Simulator.Simulation(iNet);
      simu.prepare();
      console.log(JSON.stringify(simu.traces))
      console.log(simu.conditions)
      const log = new EventLog([...simu.traces.values()]);

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



  simulate(): void {
    throw new Error("Method not implemented.");
  }

}