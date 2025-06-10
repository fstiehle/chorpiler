import { Guard, Place, TaskLabel, Transition } from "../Parser/Element";
import { INetFastXMLParser } from "../Parser/FastXMLParser";
import { INetParser } from "../Parser/Parser";
import { XESFastXMLParser } from "../util/EventLog/XESFastXMLParser";
import { IXESParser } from "../util/EventLog/XESParser";
import { Event, EventLog, InstanceDataChange } from "../util/EventLog/EventLog"
import fs from 'fs';
import path from 'path';
import Mustache from "mustache";
import { Trace } from "../util/EventLog/Trace";
import { TemplateEngine } from "../Generator/TemplateEngine";
import { TriggerEncoding } from "../Generator/Encoding/TriggerEncoding";
import { CaseVariable } from "../Generator/Encoding/Encoding";
import SolDefaultContractGenerator from "../Generator/target/Sol/DefaultGenerator";
import { GeneratorConstructor } from "../Generator/Generator";

const LOGGING_ENABLED = false; // Toggleable logging

type options = { 
  unfoldSubNets?: boolean, 
  loopProtection?: boolean, 
  parseConditions?: boolean 
}

export interface ISimulation {
  generate(generator: TemplateEngine): Promise<{ traces: Trace[], contract: { target: string, encoding: TriggerEncoding } | null }>;
}

export class Simulator {

  constructor(
    public workdir: string = ".",
    public bpmnDir: string = path.join(workdir + "/data/bpmn"),
    public bpmnParser: INetParser = new INetFastXMLParser(),
    public xesDir: string = path.join(workdir + "/data/generated"),
    public xesParser: IXESParser = new XESFastXMLParser(),
    public contractDir: string = path.join(workdir + "/data/generated"),
    public generatorType: GeneratorConstructor = SolDefaultContractGenerator
  ) {}

  async generate(prePend = "", sim: Simulation): Promise<void> {
    const bpmnFiles = fs.readdirSync(this.bpmnDir).filter(file => file.endsWith('.bpmn'));

    for (const file of bpmnFiles) {
      console.log(`Simulation for ${file}`);
      const filePath = path.join(this.bpmnDir, file);
      const model = fs.readFileSync(filePath);
      const nets = await this.bpmnParser!.fromXML(model);
      const iNet = nets[0]; // only support one model
      iNet.id = prePend + iNet.id;
      const generator = new this.generatorType(iNet);
      generator.addCaseVariable(new CaseVariable("conditions", "uint", "uint public conditions;", true));

      const simRes = await sim.generate(generator);
      if (simRes.contract === null || simRes.traces.length === 0) {
        console.warn(`No contract or traces generated for ${file}, skipping.`);
        continue;
      }

      const log = new EventLog([...simRes.traces.values()]);
      const template = fs.readFileSync(path.join(__dirname, "./templates/xes", "log.mustache.xes"), "utf-8");
      const renderedLog = Mustache.render(template, log);

      if (!fs.existsSync(this.contractDir)) fs.mkdirSync(this.contractDir, { recursive: true });
      if (!fs.existsSync(this.xesDir)) fs.mkdirSync(this.xesDir, { recursive: true });

      fs.writeFileSync(path.join(this.xesDir, `${path.basename(file, '.bpmn')}`) + ".xes", renderedLog, "utf-8");
      fs.writeFileSync(path.join(this.contractDir, `${path.basename(file, '.bpmn')}`) + ".sol", simRes.contract.target, "utf-8");
      fs.writeFileSync(path.join(this.contractDir, `${path.basename(file, '.bpmn')}`) + ".json", JSON.stringify(TriggerEncoding.toJSON(simRes.contract.encoding)), "utf-8");
      console.log(`Generated log and contract (${path.basename(file, '.bpmn')}) written to ${this.xesDir} and ${this.contractDir}`);
    }
  }
}

export class Simulation implements ISimulation {
  public loggingEnabled = false; // Toggleable logging

  constructor(
    public options: options = { 
      unfoldSubNets: true, 
      loopProtection: false,
      parseConditions: false
    }) {}

  async generate(contractGenerator: TemplateEngine): Promise<{ traces: Trace[], contract: { target: string, encoding: TriggerEncoding } | null }> {
    const traces = this.replay(contractGenerator);
    const contract = await this.generateContract(contractGenerator, traces);
    return { traces, contract };
  }

  async generateContract(contractGenerator: TemplateEngine, traces: Trace[]): Promise<{ target: string, encoding: TriggerEncoding } | null> {
    if (traces.length === 0) {
      console.warn(`No trace generated for ${contractGenerator.iNet.id}`);
      return null;
    }
    const contract = await contractGenerator.compile(this.options.unfoldSubNets, this.options.loopProtection);
    return contract;
  }

  replay(contractGenerator: TemplateEngine): Trace[] {
    const traces: Trace[] = [];
    const conditions = new Map<string, number>(); 

    // New: Track visited transitions for loop detection and flushing
    let visited: Transition[] = [];

    const addConditionToLog = (
      currentTrace: Trace, 
      conditionName: string, 
      conditionID: number,
      addNext = false
    ) => {
      const lastEvent = currentTrace.events.at(-1);
      if (lastEvent && !addNext) {
        lastEvent.dataChange = lastEvent.dataChange || [];
        lastEvent.dataChange.push(new InstanceDataChange(conditionName, conditionID));
      } else {
        currentTrace.events.push(
          new Event(
            "Instance Data Change",
            "Instance Data Change",
            [...contractGenerator.iNet.participants.values()][0]!.id,
            "",
            [new InstanceDataChange(conditionName, conditionID)]
          )
        );
      }
    }

    const extractUniqueBitmaskNumbers = (expression: string): number[] => {
      const regex = /&\s*(\d+)/g;
      const numbers = new Set<number>();
      let match;

      while ((match = regex.exec(expression)) !== null) {
        numbers.add(Number(match[1]));
      }

      return Array.from(numbers);
    }

    const processTransition = (
      transitionCandidate: Transition,
      currentTrace: Trace
    ) => {
      // If the transition has been visited before in this trace, flush visited and reset
      if (visited.includes(transitionCandidate)) {
        // Flush visited transitions to the log as a special event
        if (visited.length > 0) {
          addConditionToLog(currentTrace, "conditions", 0, true);
          logIfEnabled(
            `Loop detected: Flushing visited transitions [${visited.map(t => t.id).join(", ")}] and resetting visited.`
          );
          visited = [];
        }
      }
      visited.push(transitionCandidate);

      // Add the transition to the trace if it has a TaskLabel
      if (transitionCandidate.label instanceof TaskLabel) {
        currentTrace.events.push(
          new Event(
            transitionCandidate.label.name,
            transitionCandidate.id,
            transitionCandidate.label.sender.id
          )
        );
      }
    
      // Handle conditions for the transition
      const condition = this.getCondition(transitionCandidate);

      if (condition) {
        if (this.options.parseConditions) {
          // parse numbers from the condition, for each add it to the log
          const conditionIDs = extractUniqueBitmaskNumbers(condition);
          for (const id of conditionIDs) {
            addConditionToLog(currentTrace, "conditions", id);
          }
        } else {
          if (!conditions.has(transitionCandidate.id)) {
            transitionCandidate.label.guard?.conditions.clear();
            conditions.set(transitionCandidate.id, 1 << conditions.size);
          }
          const conditionID = conditions.get(transitionCandidate.id)!;
          // Add instance data change to the last event or create a new event
          addConditionToLog(currentTrace, "conditions", conditionID);

          // Update the guard for the transition
          const guard = new Guard(`conditions[${conditionID}] == true`);
          guard.conditions.set("", `conditions & ${conditionID} == ${conditionID}`);
          transitionCandidate.label.guard = guard;
        }
      }
    }

    const initial = contractGenerator.iNet.initial!;
    const end = contractGenerator.iNet.end!;
    const enabled: Place[] = [initial]; // Start with the initial place
    const candidates: Transition[] = [...initial.target]; // Initial candidates are the transitions from the initial place
    const executed: Transition[] = [];
    const toExecute: Transition[] = [...contractGenerator.iNet.elements.values()]
      .filter((t): t is Transition => t instanceof Transition);
    const maxTraces = 2500; // Threshold for maximum log entries
    const log = new EventLog([]); // Initialize the log variable
    let currentTrace = new Trace([]);

    // Logging helper
    const logIfEnabled = (...args: any[]) => {
      if (LOGGING_ENABLED) console.log(...args);
    };

    logIfEnabled("To Execute", toExecute.map((t) => t.id));
    logIfEnabled("Starting replay...");
    logIfEnabled(`Initial place: ${initial.id}, End place: ${end.id}`);
    logIfEnabled("Initial candidates:", candidates.map((t) => t.id));

    while (log.traces.length < maxTraces) {
      if (toExecute.every((t) => executed.includes(t))) {
        logIfEnabled("All transitions executed. Stopping replay.");
        break;
      }

      // Check for execution candidates
      const executableCandidates = candidates.filter((t) =>
        t.source.every((p) => enabled.includes(p))
      );
      if (executableCandidates.length === 0) {
        console.error("Deadlock detected: No executable transitions.");
        return [];
      }

      // Prioritize transitions that are both in toExecute and candidates
      const prioritizedCandidates = executableCandidates.filter((t) => toExecute.includes(t));
      const availableCandidates = prioritizedCandidates.length > 0 ? prioritizedCandidates : executableCandidates;

      // Pick a random candidate
      const transitionCandidate = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];
      logIfEnabled("Selected transition candidate:", transitionCandidate.id);

      // Process the transition
      processTransition(transitionCandidate, currentTrace);

      // Update enabled places
      transitionCandidate.source.forEach((p) => {
        const index = enabled.indexOf(p);
        if (index !== -1) enabled.splice(index, 1); // Remove source places from enabled
      });

      transitionCandidate.target.forEach((p) => {
        if (!enabled.includes(p)) enabled.push(p); // Add target places to enabled
      });

      // Update candidates and executed lists
      candidates.splice(candidates.indexOf(transitionCandidate), 1); // Remove from candidates
      executed.push(transitionCandidate); // Add to executed

      logIfEnabled("Enabled places after execution:", enabled.map((p) => p.id));
      logIfEnabled("Executed transitions:", executed.map((t) => t.id));

      if (transitionCandidate.target.includes(end)) {
        logIfEnabled("End place reached. Flushing trace to log.");
        log.traces.push(currentTrace);
        logIfEnabled("Trace added to log:", currentTrace.events.map((e) => e.name));

        // Reset state for the next trace
        enabled.length = 0;
        enabled.push(initial);
        candidates.length = 0;
        candidates.push(...initial.target);
        executed.length = 0;
        currentTrace = new Trace([]);
        visited = [];
        logIfEnabled("State reset for the next trace.");
        continue;
      }

      // Add new transitions to candidates
      transitionCandidate.target.forEach((p) => {
        p.target.forEach((t) => {
          if (!candidates.includes(t)) candidates.push(t);
        });
      });

      logIfEnabled("Updated candidates:", candidates.map((t) => t.id));
    }

    // Remove duplicate traces from the log
    log.traces = log.traces.filter((trace, index, self) =>
      index === self.findIndex((t) =>
        t.events.map((e) => e.id).join(",") === trace.events.map((e) => e.id).join(",")
      )
    );

    logIfEnabled("Generated log:", log.traces.map((trace) => trace.events.map((e) => e.name)));
    traces.push(...log.traces);
    return traces;
  }

  private getCondition(transition: Transition) {
    if (transition.label.guard && transition.label.guard.conditions.size > 0) 
      return [...transition.label.guard.conditions.values()].join(" && ");
  }
}