import { Guard, Place, PlaceType, TaskLabel, Transition } from "../Parser/Element";
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
import { TemplateEngine } from "../Generator/TemplateEngine";
import SolDefaultContractGenerator from "../Generator/target/Sol/DefaultGenerator";
import { TriggerEncoding } from "../Generator/Encoding/TriggerEncoding";
import { CaseVariable } from "../Generator/Encoding/Encoding";

export interface ISimulator {
  generate(): void;
}

export class Simulator implements ISimulator {

  constructor(
    public workdir: string = ".",
    public bpmnDir: string = path.join(workdir + "/data/bpmn"),
    public bpmnParser: INetParser = new INetFastXMLParser(),
    public xesDir: string = path.join(workdir + "/data/generated"),
    public xesParser: IXESParser = new XESFastXMLParser(),
    public contractDir: string = path.join(workdir + "/data/generated")
  ) {}

  private static Simulation = class {
    public traces = new Array<Trace>();
    public visited = new Array<string[]>();
    public conditions = new Map<number, string>(); 
    public contract: null | { target: string, encoding: TriggerEncoding } = null;

    constructor(public contractGenerator: TemplateEngine) {}

    async generate() {
      this.generateLog();
      await this.generateContract();
    }

    async generateContract() {
      if (this.traces.length === 0) return console.warn(`No trace generated for ${this.contractGenerator.iNet.id}`);
      this.contract = await this.contractGenerator.compile();
      return this.contract;
    }

    generateLog() {
      this.replay(this.contractGenerator.iNet.initial!, [], new Trace([]))
    }

    replay(current: Place, visited: string[], trace: Trace) {
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
              [...this.contractGenerator.iNet.participants.values()].at(0)!.id,
              "",
              [new InstanceDataChange(`conditions`, condID)]
            ));
            const guard = new Guard(`conditions[${condID}] == true`)
            guard.condition = `conditions & ${condID} == ${condID}`;
            guard.language = "Solidity";
            transition.label.guards.clear();
            transition.label.guards.set(guard.name, guard);
          }
          if (transition.label instanceof TaskLabel) {      
            trace.events.push(new Event(
              transition.label.name,
              transition.label.sender.id
            ));
          }
          for (const nextPlace of transition.target) {
            this.replay(nextPlace, visited, trace);
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

  async generate(): Promise<void> {
    const bpmnFiles = fs.readdirSync(this.bpmnDir).filter(file => file.endsWith('.bpmn'));

    for (const file of bpmnFiles) {
      console.log(`Simulation for ${file}`);
      const filePath = path.join(this.bpmnDir, file);
      const model = fs.readFileSync(filePath);
      const nets = await this.bpmnParser!.fromXML(model);
      const iNet = nets[0]; // only support one model

      const generator = new SolDefaultContractGenerator(iNet);
      generator.addCaseVariable(new CaseVariable("conditions", "uint", "uint public conditions;", true));
      const sim = new Simulator.Simulation(generator);
      await sim.generate();

      if (sim.traces.length === 0) continue;

      const log = new EventLog([...sim.traces.values()]);
      const template = fs.readFileSync(path.join(__dirname, "./templates/xes", "log.mustache.xes"), "utf-8");
      const renderedLog = Mustache.render(template, log);

      if (!fs.existsSync(this.contractDir)) fs.mkdirSync(this.contractDir, { recursive: true });
      if (!fs.existsSync(this.xesDir)) fs.mkdirSync(this.xesDir, { recursive: true });

      fs.writeFileSync(path.join(this.xesDir, `${path.basename(file, '.bpmn')}`) + ".xes", renderedLog, "utf-8");
      fs.writeFileSync(path.join(this.contractDir, `${path.basename(file, '.bpmn')}`) + ".sol", sim.contract!.target, "utf-8");
      console.log(`Generated log and contract written to ${this.xesDir} and ${this.contractDir}`);
    }
  }
}