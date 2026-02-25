import * as fs from "fs";
import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import path from "path";
import util from "util";
import { CaseVariable } from "../src/Generator/Encoding/Encoding.js";
import { TriggerEncoding } from "../src/Generator/Encoding/TriggerEncoding.js";
import SolDefaultContractGenerator from "../src/Generator/target/Sol/DefaultGenerator.js";
import SolInstanceGenerator from "../src/Generator/target/Sol/InstanceGenerator.js";
import SolStateChannelContractGenerator from "../src/Generator/target/Sol/StateChannelGenerator.js";
import { TemplateEngine } from "../src/Generator/TemplateEngine.js";
import { INetFastXMLParser } from "../src/Parser/FastXMLParser.js";
import { INetParser } from "../src/Parser/Parser.js";
import { BPMN_PATH, CONTRACTS_PATH } from "./config.js";
import {
  AddressEntry,
  compileBpmn,
  compileINet,
  parseINet,
} from "./helpers/compiler-helpers.js";

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

describe("Call Choreography Tests", () => {
  it("Call choreography to Sol Contract", async () => {
    // Read and verify Choreography_0betnp1.json
    const choreography0betnp1Path = path.join(
      CONTRACTS_PATH,
      "Choreography_0betnp1.json",
    );
    assert.ok(
      fs.existsSync(choreography0betnp1Path),
      "Choreography_0betnp1.json should exist",
    );

    const choreography0betnp1Data = JSON.parse(
      fs.readFileSync(choreography0betnp1Path, "utf8"),
    );
    assert.strictEqual(
      choreography0betnp1Data.isCalled,
      true,
      "Choreography_0betnp1 should have isCalled: true",
    );
    assert.strictEqual(
      choreography0betnp1Data.isInstanced,
      true,
      "Choreography_0betnp1 should have isInstanced: true",
    );

    // Read and verify CallChoreo.json
    const callChoreoPath = path.join(CONTRACTS_PATH, "CallChoreo.json");
    assert.ok(fs.existsSync(callChoreoPath), "CallChoreo.json should exist");

    const callChoreoData = JSON.parse(fs.readFileSync(callChoreoPath, "utf8"));
    assert.strictEqual(
      Object.keys(callChoreoData.calls).length,
      1,
      "CallChoreo should have calls size of 1",
    );
  });
});
