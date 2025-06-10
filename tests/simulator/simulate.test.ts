import SolDefaultContractGenerator from "../../src/Generator/target/Sol/DefaultGenerator";
import { Simulation, Simulator } from "../../src/Simulator/Simulator";
import { XESFastXMLParser } from "../../src/util/EventLog/XESFastXMLParser";
import { EventLog } from "../../src/util/EventLog/EventLog";
import * as fs from "fs";
import * as path from "path";
import { TriggerEncoding } from "../../src/Generator/Encoding/TriggerEncoding";

describe('Simulate...', () => {

  const sim = new Simulator(__dirname);

  before(() => {
    return sim.generate(
      "test_", 
      new Simulation({ unfoldSubNets: true, loopProtection: true, parseConditions: true }));
  });

  it("should parse every XES in data/generated and generate a non-conforming log", async () => {
    const parser = new XESFastXMLParser();
    const generatedDir = path.resolve(__dirname, "./data/generated");
    const files = fs.readdirSync(generatedDir).filter(f => f.endsWith(".xes"));

    for (const file of files) {
      const filePath = path.join(generatedDir, file);
      const jsonPath = filePath.replace(/\.xes$/, ".json");
      let triggerEncoding: TriggerEncoding | undefined = undefined;
      if (fs.existsSync(jsonPath)) {
        triggerEncoding = TriggerEncoding.fromJSON(JSON.parse(fs.readFileSync(jsonPath, "utf-8")));
      } else {
        console.warn(`No corresponding JSON found for ${file}, skipping.`);
        continue;
      }
      const xml = fs.readFileSync(filePath);
      const eventLog: EventLog = await parser.fromXML(xml);

      // Generate a non-conforming log by shuffling events in each trace
      const nonConformingLog = EventLog.genNonConformingLog(eventLog, triggerEncoding, 30);

    }
  });

});