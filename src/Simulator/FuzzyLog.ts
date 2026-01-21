/**
 * FuzzyLog class for generating non-conforming traces based on conforming logs
 */
import fs from "fs";
import path from "path";
import Mustache from "mustache";
import { fileURLToPath } from "url";
import {
  Event,
  EventLog,
  InstanceDataChange,
} from "../util/EventLog/EventLog.js";
import { Trace } from "../util/EventLog/Trace.js";
import { TriggerEncoding } from "../Generator/Encoding/TriggerEncoding.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FuzzyLogConfig {
  outputDir?: string;
  seed?: string;
  passes?: number;
}

export class FuzzyLog {
  private readonly outputDir: string;
  private readonly seed: string;
  private readonly passes: number;

  constructor(config: FuzzyLogConfig = {}) {
    this.outputDir = config.outputDir ?? path.join(".", "data", "generated");
    this.seed = config.seed ?? "b";
    this.passes = config.passes ?? 1;
  }

  /**
   * Generate non-conforming traces based on conforming logs
   */
  public genNonConformingLog(
    log: EventLog,
    process: TriggerEncoding,
    toGenerate = 10,
    _seed?: string,
    passes?: number,
  ): EventLog {
    const useSeed = _seed ?? this.seed;
    const usePasses = passes ?? this.passes;

    const randomParticipantName = () => {
      return [...process.participants.keys()][
        seedRandMax(process.participants.size)
      ];
    };

    const randomEventID = () => {
      return [...process.tasks.keys()][seedRandMax(process.tasks.size)];
    };

    const getEventNameForID = (eventID: string) => {
      for (const trace of log.traces) {
        for (const event of trace.events) {
          if (event.id === eventID) {
            return event.name;
          }
        }
      }
      return eventID; // fallback if not found
    };

    // Simple seed-based random number generator
    function seed(s: string) {
      let hash = 0;
      if (s.length === 0) return () => Math.random();
      for (let i = 0; i < s.length; i++) {
        const chr = s.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return function () {
        hash = (hash * 1664525 + 1013904223) % 4294967296;
        return hash / 4294967296;
      };
    }

    const seedRand = seed(useSeed);
    const seedRandMax = (max: number) => Math.floor(seedRand() * max);

    const generatedLog = new EventLog(new Array<Trace>());

    let conformingNr = 0;
    for (let i = 0; i < toGenerate; i++) {
      // Pick a random conforming trace as basis
      // (!) make a deep copy
      let genEvents = [...log.traces[seedRandMax(log.traces.length)].events];

      if (genEvents.length < 1) {
        console.warn("Empty trace found, skipping");
        continue;
      }

      for (let j = 0; j < usePasses; j++) {
        const randOperation = seedRandMax(5);

        // Only operate on events that are not "Instance Data Change"
        const validEventIndexes = genEvents
          .map((e, idx) => (e.name.trim() !== "InstanceDataChange" ? idx : -1))
          .filter((idx) => idx !== -1);

        switch (randOperation) {
          case 0: {
            // add an event
            const id = randomEventID();
            genEvents.splice(
              seedRandMax(genEvents.length),
              0,
              new Event(
                getEventNameForID(id),
                id,
                randomParticipantName(),
                randomParticipantName(),
              ),
            );
            break;
          }
          case 1: {
            // move an event
            if (validEventIndexes.length > 0) {
              const moveIdx =
                validEventIndexes[seedRandMax(validEventIndexes.length)];
              const [event] = genEvents.splice(moveIdx, 1);
              genEvents.splice(seedRandMax(genEvents.length + 1), 0, event);
            }
            break;
          }
          case 2: {
            // duplicate an event
            if (validEventIndexes.length > 0) {
              const dupIdx =
                validEventIndexes[seedRandMax(validEventIndexes.length)];
              genEvents.splice(
                seedRandMax(genEvents.length + 1),
                0,
                genEvents[dupIdx],
              );
            }
            break;
          }
          case 3: {
            // remove an event
            if (validEventIndexes.length > 0) {
              const remIdx =
                validEventIndexes[seedRandMax(validEventIndexes.length)];
              genEvents.splice(remIdx, 1);
            }
            break;
          }
          case 4: {
            // switch the order of two events
            if (validEventIndexes.length > 1) {
              const idx1 =
                validEventIndexes[seedRandMax(validEventIndexes.length)];
              let idx2 = idx1;
              while (idx2 === idx1) {
                idx2 = validEventIndexes[seedRandMax(validEventIndexes.length)];
              }
              // Swap only if both are valid and not the same
              const tmp = genEvents[idx1];
              genEvents[idx1] = genEvents[idx2];
              genEvents[idx2] = tmp;
            }
            break;
          }
        }
      }

      const isConforming = log.traces.some(
        (t) =>
          // Only compare non-"Instance Data Change" events
          t.events.filter((e) => e.name !== "Instance Data Change").length ===
            genEvents.filter((e) => e.name !== "Instance Data Change").length &&
          t.events
            .filter((e) => e.name !== "Instance Data Change")
            .every(
              (e, idx) =>
                e.id ===
                  genEvents.filter((ev) => ev.name !== "Instance Data Change")[
                    idx
                  ].id &&
                e.source ===
                  genEvents.filter((ev) => ev.name !== "Instance Data Change")[
                    idx
                  ].source,
            ),
      );

      if (isConforming) {
        conformingNr++;
      } else {
        generatedLog.traces.push(new Trace(genEvents));
      }
    }

    console.log(
      "Generated",
      toGenerate - conformingNr,
      "non-conforming traces; generated",
      conformingNr,
      "conforming traces, which were skipped.",
    );
    return generatedLog;
  }

  /**
   * Write a log file to the output directory
   */
  public writeLogFile(log: EventLog, baseName: string): void {
    const template = fs.readFileSync(
      path.join(__dirname, "./templates/xes", "log.mustache.xes"),
      "utf-8",
    );
    const renderedLog = Mustache.render(template, log);

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const filePath = path.join(this.outputDir, `${baseName}.xes`);
    fs.writeFileSync(filePath, renderedLog, "utf-8");

    console.log(`Non-conforming log written to: ${filePath}`);
  }

  /**
   * Generate and write non-conforming log in one step
   */
  public generateAndWriteNonConformingLog(
    log: EventLog,
    process: TriggerEncoding,
    baseName: string,
    toGenerate = 10,
    _seed?: string,
    passes?: number,
  ): EventLog {
    const nonConformingLog = this.genNonConformingLog(
      log,
      process,
      toGenerate,
      _seed,
      passes,
    );

    this.writeLogFile(nonConformingLog, baseName);
    return nonConformingLog;
  }

  /**
   * Set the output directory for generated logs
   */
  public setOutputDir(dir: string): void {
    (this as any).outputDir = dir;
  }

  /**
   * Get the current output directory
   */
  public getOutputDir(): string {
    return this.outputDir;
  }
}
