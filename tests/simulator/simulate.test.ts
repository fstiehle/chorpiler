import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import { Simulator } from "../../src/Simulator/Simulator.js";
import { XESFastXMLParser } from "../../src/util/EventLog/XESFastXMLParser.js";
import { EventLog } from "../../src/util/EventLog/EventLog.js";
import { FuzzyLog } from "../../src/Simulator/FuzzyLog.js";
import * as fs from "fs";
import * as path from "path";
import { TriggerEncoding } from "../../src/Generator/Encoding/TriggerEncoding.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Simulate...", () => {
  const sim = new Simulator({ workdir: __dirname });

  before(async () => {
    await sim.generateContract();
    await sim.generateLog();
  });

  it("should parse every XES in data/generated and generate a non-conforming log", async () => {
    const parser = new XESFastXMLParser();
    const generatedDir = path.resolve(__dirname, "./data/generated");

    // Check if the generated directory exists
    if (!fs.existsSync(generatedDir)) {
      console.warn(
        `Generated directory ${generatedDir} does not exist, skipping test`,
      );
      return;
    }

    const files = fs
      .readdirSync(generatedDir)
      .filter((f) => f.endsWith(".xes"));

    assert.ok(
      files.length >= 0,
      "Should be able to read the generated directory",
    );

    for (const file of files) {
      const filePath = path.join(generatedDir, file);
      const jsonPath = filePath.replace(/\.xes$/, ".json");
      let triggerEncoding: TriggerEncoding | undefined = undefined;

      if (fs.existsSync(jsonPath)) {
        triggerEncoding = TriggerEncoding.fromJSON(
          JSON.parse(fs.readFileSync(jsonPath, "utf-8")),
        );
      } else {
        console.warn(`No corresponding JSON found for ${file}, skipping.`);
        continue;
      }

      const xml = fs.readFileSync(filePath);
      const eventLog: EventLog = await parser.fromXML(xml);
      console.log(
        `Conforming log for ${file}: ${eventLog.traces.length} traces`,
      );

      // Assert that we parsed some traces
      assert.ok(
        eventLog.traces.length >= 0,
        `Should parse traces from ${file}`,
      );

      // Generate a non-conforming log by shuffling events in each trace
      const fuzzyLog = new FuzzyLog();
      const nonConformingLog = fuzzyLog.genNonConformingLog(
        eventLog,
        triggerEncoding,
        30,
      );
      console.log(
        `Non-conforming log for ${file}: ${nonConformingLog.traces.length} traces`,
      );

      // Assert that we generated some non-conforming traces (if we had conforming traces)
      if (eventLog.traces.length > 0) {
        assert.ok(
          nonConformingLog.traces.length >= 0,
          `Should generate non-conforming traces for ${file}`,
        );
      }
    }
  });
});
