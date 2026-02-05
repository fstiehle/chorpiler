import fs from "fs";
import Mustache from "mustache";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { CaseVariable } from "../Generator/Encoding/Encoding.js";
import { TriggerEncoding } from "../Generator/Encoding/TriggerEncoding.js";
import { GeneratorConstructor } from "../Generator/Generator.js";
import SolDefaultContractGenerator from "../Generator/target/Sol/DefaultGenerator.js";
import { TemplateEngine } from "../Generator/TemplateEngine.js";
import { Guard, Place, TaskLabel, Transition } from "../Parser/Element.js";
import { INetFastXMLParser } from "../Parser/FastXMLParser.js";
import { INetParser } from "../Parser/Parser.js";
import {
  Event,
  EventLog,
  InstanceDataChange,
} from "../util/EventLog/EventLog.js";
import { Trace } from "../util/EventLog/Trace.js";
import { XESFastXMLParser } from "../util/EventLog/XESFastXMLParser.js";
import { IXESParser } from "../util/EventLog/XESParser.js";
import { INetEncoder } from "../Generator/Encoder.js";
import { InteractionNet } from "../Parser/InteractionNet.js";

const LOGGING_ENABLED = false; // Toggleable logging

export interface LogGenerationOptions {
  parseConditions?: boolean;
  maxTraces?: number;
}

export interface ContractGenerationOptions {
  unfoldSubNets?: boolean;
  loopProtection?: boolean;
  parseConditions?: boolean;
  maxTraces?: number;
}

export interface SimulatorConfig {
  workdir?: string;
  bpmnDir?: string;
  bpmnParser?: INetParser;
  xesDir?: string;
  xesParser?: IXESParser;
  contractDir?: string;
  generatorType?: GeneratorConstructor;
  fileFilter?: (filename: string) => boolean;
  outputFormat?: {
    xes?: boolean;
    contract?: boolean;
    encoding?: boolean;
  };
  logging?: {
    enabled?: boolean;
    level?: "error" | "warn" | "info" | "debug";
  };
}

export class Simulator {
  public readonly workdir: string;
  public readonly bpmnDir: string;
  public readonly bpmnParser: INetParser;
  public readonly xesDir: string;
  public readonly xesParser: IXESParser;
  public readonly contractDir: string;
  public readonly generatorType: GeneratorConstructor;
  public readonly fileFilter: (filename: string) => boolean;
  public readonly logging: boolean;

  constructor(config: SimulatorConfig = {}) {
    this.workdir = config.workdir ?? ".";
    this.bpmnDir = config.bpmnDir ?? path.join(this.workdir, "data", "bpmn");
    this.bpmnParser = config.bpmnParser ?? new INetFastXMLParser();
    this.xesDir = config.xesDir ?? path.join(this.workdir, "data", "generated");
    this.xesParser = config.xesParser ?? new XESFastXMLParser();
    this.contractDir =
      config.contractDir ?? path.join(this.workdir, "data", "generated");
    this.generatorType = config.generatorType ?? SolDefaultContractGenerator;
    this.fileFilter =
      config.fileFilter ?? ((filename: string) => filename.endsWith(".bpmn"));
    this.logging = config.logging?.enabled ?? true;
  }

  // The log generator will generate a conditions array,
  // where each XOR gateway is represented by a binary i = 0 | 1.
  // This is necessary to generate mock conditions.
  async generateLog(
    prePend = "",
    options: LogGenerationOptions = {},
  ): Promise<void> {
    const bpmnFiles = fs.readdirSync(this.bpmnDir).filter(this.fileFilter);

    for (const file of bpmnFiles) {
      if (this.logging) console.log(`Log generation for ${file}`);
      const filePath = path.join(this.bpmnDir, file);
      const model = fs.readFileSync(filePath);

      try {
        const nets = await this.bpmnParser!.fromXML(model);
        const encoder = new INetEncoder();
        const iNet = encoder.unfoldSubNets(nets[0]); // only support one model
        iNet.id = prePend + iNet.id;

        const traces = this.replay(iNet, options);
        if (traces.length === 0) {
          console.warn(`No traces generated for ${file}, skipping.`);
          continue;
        }

        const baseName = prePend + path.basename(file, ".bpmn");
        this.writeLogFile(traces, baseName);

        console.log(`Generated log (${baseName}) written to ${this.xesDir}`);
      } catch (error) {
        console.error(
          `Failed to generate log for ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
    }
  }

  async generateContract(
    prePend = "",
    options: ContractGenerationOptions = {},
  ): Promise<void> {
    const bpmnFiles = fs.readdirSync(this.bpmnDir).filter(this.fileFilter);

    for (const file of bpmnFiles) {
      if (this.logging) console.log(`Contract generation for ${file}`);
      const filePath = path.join(this.bpmnDir, file);
      const model = fs.readFileSync(filePath);

      try {
        const nets = await this.bpmnParser!.fromXML(model);
        const iNet = nets[0];
        iNet.id = prePend + iNet.id;
        const generator = new this.generatorType(iNet);
        generator.addCaseVariable(
          new CaseVariable(
            "conditions",
            "uint",
            "uint public conditions;",
            true,
          ),
        );

        const contract = await this.compileContract(generator, options);
        if (!contract) {
          console.warn(`No contract generated for ${file}, skipping.`);
          continue;
        }

        const baseName = prePend + path.basename(file, ".bpmn");
        this.writeContractFiles(contract, baseName);

        console.log(
          `Generated contract (${baseName}) written to ${this.contractDir}`,
        );
      } catch (error) {
        console.error(
          `Failed to generate contract for ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
    }
  }

  private writeLogFile(traces: Trace[], baseName: string): void {
    const log = new EventLog([...traces.values()]);
    const template = fs.readFileSync(
      path.join(__dirname, "./templates/xes", "log.mustache.xes"),
      "utf-8",
    );
    const renderedLog = Mustache.render(template, log.getEncoding());

    if (!fs.existsSync(this.xesDir)) {
      fs.mkdirSync(this.xesDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(this.xesDir, `${baseName}.xes`),
      renderedLog,
      "utf-8",
    );
  }

  private writeContractFiles(
    contract: { target: string; encoding: TriggerEncoding },
    baseName: string,
  ): void {
    if (!fs.existsSync(this.contractDir)) {
      fs.mkdirSync(this.contractDir, { recursive: true });
    }

    // Write contract file
    fs.writeFileSync(
      path.join(this.contractDir, `${baseName}.sol`),
      contract.target,
      "utf-8",
    );

    // Write encoding file
    fs.writeFileSync(
      path.join(this.contractDir, `${baseName}.json`),
      JSON.stringify(TriggerEncoding.toJSON(contract.encoding)),
      "utf-8",
    );
  }

  private async compileContract(
    contractGenerator: TemplateEngine,
    options: ContractGenerationOptions,
  ): Promise<{ target: string; encoding: TriggerEncoding } | null> {
    const contract = await contractGenerator.compile({
      unfoldSubNets: options.unfoldSubNets ?? true,
      loopProtection: options.loopProtection ?? false,
    });
    return contract;
  }

  private replay(
    iNet: InteractionNet,
    options: LogGenerationOptions | ContractGenerationOptions = {},
  ): Trace[] {
    const traces: Trace[] = [];
    const conditions = new Map<string, number>();

    // New: Track visited transitions for loop detection and flushing
    let visited: Transition[] = [];

    const addConditionToLog = (
      currentTrace: Trace,
      conditionName: string,
      conditionID: number,
      addNext = false,
    ) => {
      const lastEvent = currentTrace.events.at(-1);
      if (lastEvent && !addNext) {
        lastEvent.dataChange = lastEvent.dataChange || [];
        lastEvent.dataChange.push(
          new InstanceDataChange(conditionName, conditionID),
        );
      } else {
        currentTrace.events.push(
          new Event(
            "Instance Data Change",
            "Instance Data Change",
            [...iNet.participants.values()][0]!.id,
            "",
            [new InstanceDataChange(conditionName, conditionID)],
          ),
        );
      }
    };

    const extractUniqueBitmaskNumbers = (expression: string): number[] => {
      const regex = /&\s*(\d+)/g;
      const numbers = new Set<number>();
      let match;

      while ((match = regex.exec(expression)) !== null) {
        numbers.add(Number(match[1]));
      }

      return Array.from(numbers);
    };

    const processTransition = (
      transitionCandidate: Transition,
      currentTrace: Trace,
    ) => {
      // If the transition has been visited before in this trace, flush visited and reset
      if (visited.includes(transitionCandidate)) {
        // Flush visited transitions to the log as a special event
        if (visited.length > 0) {
          addConditionToLog(currentTrace, "conditions", 0, true);
          logIfEnabled(
            `Loop detected: Flushing visited transitions [${visited.map((t) => t.id).join(", ")}] and resetting visited.`,
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
            transitionCandidate.label.sender.id,
          ),
        );
      }

      // Handle conditions for the transition
      const condition = this.getCondition(transitionCandidate);

      if (condition) {
        if (options.parseConditions) {
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
          guard.conditions.set(
            "",
            `conditions & ${conditionID} == ${conditionID}`,
          );
          transitionCandidate.label.guard = guard;
        }
      }
    };

    const initial = iNet.initial!;
    const end = iNet.end!;
    const enabled: Place[] = [initial]; // Start with the initial place
    const candidates: Transition[] = [...initial.target]; // Initial candidates are the transitions from the initial place
    const executed: Transition[] = [];
    const toExecute: Transition[] = [...iNet.elements.values()].filter(
      (t): t is Transition => t instanceof Transition,
    );
    const maxTraces = options.maxTraces ?? 2500; // Threshold for maximum log entries
    const log = new EventLog([]); // Initialize the log variable
    let currentTrace = new Trace([]);

    // Logging helper
    const logIfEnabled = (...args: any[]) => {
      if (LOGGING_ENABLED) console.log(...args);
    };

    logIfEnabled(
      "To Execute",
      toExecute.map((t) => t.id),
    );
    logIfEnabled("Starting replay...");
    logIfEnabled(`Initial place: ${initial.id}, End place: ${end.id}`);
    logIfEnabled(
      "Initial candidates:",
      candidates.map((t) => t.id),
    );

    while (log.traces.length < maxTraces) {
      if (toExecute.every((t) => executed.includes(t))) {
        logIfEnabled("All transitions executed. Stopping replay.");
        break;
      }

      // Check for execution candidates
      const executableCandidates = candidates.filter((t) =>
        t.source.every((p) => enabled.includes(p)),
      );
      if (executableCandidates.length === 0) {
        console.error("Deadlock detected: No executable transitions.");
        return [];
      }

      // Prioritize transitions that are both in toExecute and candidates
      const prioritizedCandidates = executableCandidates.filter((t) =>
        toExecute.includes(t),
      );
      const availableCandidates =
        prioritizedCandidates.length > 0
          ? prioritizedCandidates
          : executableCandidates;

      // Pick a random candidate
      const transitionCandidate =
        availableCandidates[
          Math.floor(Math.random() * availableCandidates.length)
        ];
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

      logIfEnabled(
        "Enabled places after execution:",
        enabled.map((p) => p.id),
      );
      logIfEnabled(
        "Executed transitions:",
        executed.map((t) => t.id),
      );

      if (transitionCandidate.target.includes(end)) {
        logIfEnabled("End place reached. Flushing trace to log.");
        log.traces.push(currentTrace);
        logIfEnabled(
          "Trace added to log:",
          currentTrace.events.map((e) => e.name),
        );

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

      logIfEnabled(
        "Updated candidates:",
        candidates.map((t) => t.id),
      );
    }

    // Remove duplicate traces from the log
    log.traces = log.traces.filter(
      (trace, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.events.map((e: any) => e.id).join(",") ===
            trace.events.map((e: any) => e.id).join(","),
        ),
    );

    logIfEnabled(
      "Generated log:",
      log.traces.map((trace) => trace.events.map((e: any) => e.name)),
    );
    traces.push(...log.traces);
    return traces;
  }

  private getCondition(transition: Transition) {
    if (transition.label.guard && transition.label.guard.conditions.size > 0)
      return [...transition.label.guard.conditions.values()].join(" && ");
  }
}
