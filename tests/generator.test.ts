import * as fs from "fs";
import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import path from "path";
import util from "util";
import { CaseVariable } from "../src/Generator/Encoding/Encoding.js";
import SolDefaultContractGenerator from "../src/Generator/target/Sol/DefaultGenerator.js";
import { INetFastXMLParser } from "../src/Parser/FastXMLParser.js";
import { INetParser } from "../src/Parser/Parser.js";
import { BPMN_PATH, CONTRACTS_PATH, CHANNEL_CONTRACTS_PATH } from "./config.js";
import { compileBpmn } from "./helpers/compiler-helpers.js";

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * Helper function to verify call choreography contracts
 * @param contractsPath - Base path where contracts are stored
 * @param mainContractName - Name of the main contract (e.g., "CallChoreo")
 * @param calledChoreographies - Array of called choreography IDs to verify
 * @param expectedCallsCount - Expected number of calls in the main contract
 */
function verifyCallChoreography(
  contractsPath: string,
  mainContractName: string,
  calledChoreographies: string[],
  expectedCallsCount: number
) {
  // Verify each called choreography
  for (const choreoId of calledChoreographies) {
    const choreoPath = path.join(contractsPath, `${choreoId}.json`);
    assert.ok(
      fs.existsSync(choreoPath),
      `${choreoId}.json should exist`
    );

    const choreoData = JSON.parse(fs.readFileSync(choreoPath, "utf8"));
    assert.strictEqual(
      choreoData.isCalled,
      true,
      `${choreoId} should have isCalled: true`
    );
    assert.strictEqual(
      choreoData.isInstanced,
      true,
      `${choreoId} should have isInstanced: true`
    );
  }

  // Verify main contract
  const mainContractPath = path.join(contractsPath, `${mainContractName}.json`);
  assert.ok(
    fs.existsSync(mainContractPath),
    `${mainContractName}.json should exist`
  );

  const mainContractData = JSON.parse(
    fs.readFileSync(mainContractPath, "utf8")
  );
  assert.strictEqual(
    Object.keys(mainContractData.calls).length,
    expectedCallsCount,
    `${mainContractName} should have calls size of ${expectedCallsCount}`
  );
}

describe("Generation of edge cases", () => {
  let parser: INetParser;

  beforeEach(() => {
    parser = new INetFastXMLParser();
  });

  describe("Parse correct BPMN files from edgecase collection and generate Sol Contracts", () => {
    const edgeCasesPath = path.join(BPMN_PATH, "edgecases", "shouldsucceed");
    const bpmnFiles = fs
      .readdirSync(edgeCasesPath)
      .filter((file) => file.endsWith(".bpmn"));

    bpmnFiles.forEach((bpmnFile) => {
      it(`${bpmnFile} should compile to Sol contract`, async () => {
        const data = await readFile(path.join(edgeCasesPath, bpmnFile));
        const iNets = await parser.fromXML(data);

        // Special handling for sub-choreography2.bpmn, which we test on unfold=false
        const isSubChoreography2 = bpmnFile === "sub-choreography2.bpmn";

        for (const iNet of iNets) {
          const generator = new SolDefaultContractGenerator(iNet, undefined, iNet.isCalled);

          const result = await generator.compile({
            unfoldSubNets: !isSubChoreography2,
          });

          const modelName = bpmnFile.replace(".bpmn", "");
          assert.ok(result, `Should successfully compile ${modelName} model`);
          assert.ok(result.target, "Should generate target contract code");
        }
      });
    });
  });

  describe("Parse and compile cases", () => {
    it("XOR-AND case to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "xor-and",
        [new CaseVariable("items", "bool", "false", true, "public")],
        [],
      );
    });

    it("XOR-AND case to State Channel Contract", async () => {
      await compileBpmn(
        parser,
        "xor-and",
        [new CaseVariable("items", "bool", "false", true, "public")],
        [],
        false,
        true
      );
    });

    it("Pharmacy (out of order xml file) case to Sol Contract", async () => {
      await compileBpmn(parser, "out-of-order-xml", [], []);
    });

    it("Pharmacy (out of order xml file) caseto State Channel", async () => {
      await compileBpmn(parser, "out-of-order-xml", [], [], false, true);
    });

    it("Supply chain case to Sol Contract", async () => {
      await compileBpmn(parser, "supply-chain", [], []);
    });

    it("Supply chain case to State Channel", async () => {
      await compileBpmn(parser, "supply-chain", [], [], false, true);
    });

    it("Incident Management case to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "incident-management",
        [
          new CaseVariable(
            "resolved",
            "bool",
            "false",
            true,
            "public"
          ),
        ],
        [],
      );
    });

    it("Incident Management case to State Channel", async () => {
      await compileBpmn(
        parser,
        "incident-management",
        [
          new CaseVariable(
            "resolved",
            "bool",
            "false",
            true,
            "public"
          ),
        ],
        [],
        false,
        true
      );
    });

    it("Rental Agreement case to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "rental-agreement",
        [
          new CaseVariable(
            "conditions",
            "uint",
            "0",
            true,
            "public"
          ),
        ],
        [],
      );
    });

    it("Rental Agreement case to State Channel", async () => {
      await compileBpmn(
        parser,
        "rental-agreement",
        [
          new CaseVariable(
            "conditions",
            "uint",
            "0",
            true,
            "public"
          ),
        ],
        [],
        false,
        true
      );
    });

    it("Pizza case to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "pizza",
        [new CaseVariable("items", "bool", "false", true, "public")],
        [],
      );
    });

    it("Don't unfold Rental Agreement case to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "unfold-rental-agreement",
        [
          new CaseVariable(
            "conditions",
            "uint",
            "0",
            true,
            "public"
          ),
        ],
        [],
        false,
      );
    });

    it("Don't unfold Sub Choreo case to Sol Contract", async () => {
      await compileBpmn(parser, "sub-choreo", [], [], false);
    });

    it("Don't unfold Sub Choreo case to Sol Contract", async () => {
      await compileBpmn(parser, "sub-choreo-chained", [], [], false);
    });

    it("Messages case to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "messages",
        [
          new CaseVariable(
            "pizza_order",
            "uint",
            '0',
            false,
            "public"
          ),
        ],
        [],
        false,
      );
    });

    it("Messages case to State Channel", async () => {
      await compileBpmn(
        parser,
        "messages",
        [
          new CaseVariable(
            "pizza_order",
            "uint",
            '0',
            false,
            "public"
          ),
        ],
        [],
        false,
        true
      );
    });

    it("Sub Choreo Messages case to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "sub-choreo-messages",
        [
          new CaseVariable(
            "conditions",
            "uint",
            '0',
            false,
            "public"
          ),
        ],
        [],
        false,
      );
    });

    it("Sub Choreo Messages case to State Channel", async () => {
      await compileBpmn(
        parser,
        "sub-choreo-messages",
        [
          new CaseVariable(
            "conditions",
            "uint",
            '0',
            false,
            "public"
          ),
        ],
        [],
        false,
        true
      );
    });

    it("Call choreography to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "call-choreo",
        [],
        [
          {
            callID: "Choreography_0betnp1",
            address: undefined,
          },
        ],
        false,
      );

      verifyCallChoreography(
        CONTRACTS_PATH,
        "CallChoreo",
        ["Choreography_0betnp1"],
        1
      );
    });

    it("Call choreography to State Channel", async () => {
      await compileBpmn(
        parser,
        "call-choreo",
        [],
        [
          {
            callID: "Choreography_0betnp1",
            address: undefined,
          },
        ],
        false,
        true
      );

      verifyCallChoreography(
        CHANNEL_CONTRACTS_PATH,
        "CallChoreo",
        ["Choreography_0betnp1"],
        1
      );
    });

    it("Chained Call choreography to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "call-choreo-chained",
        [],
        [
          {
            callID: "Choreography_0betnp1",
            address: undefined,
          },
          {
            callID: "Choreography_1661x4r",
            address: undefined,
          },
        ],
        false,
      );

      verifyCallChoreography(
        CONTRACTS_PATH,
        "CallChoreoChained",
        ["Choreography_0betnp1", "Choreography_1661x4r"],
        2
      );
    });

    it("Chained Call choreography to State Channel", async () => {
      await compileBpmn(
        parser,
        "call-choreo-chained",
        [],
        [
          {
            callID: "Choreography_0betnp1",
            address: undefined,
          },
          {
            callID: "Choreography_1661x4r",
            address: undefined,
          },
        ],
        false,
        true
      );

      verifyCallChoreography(
        CHANNEL_CONTRACTS_PATH,
        "CallChoreoChained",
        ["Choreography_0betnp1", "Choreography_1661x4r"],
        2
      );
    });

    it("Data Call choreography to Sol Contract", async () => {
      await compileBpmn(
        parser,
        "call-choreo-datatask",
        [new CaseVariable("order", "uint", "0", false, "private")],
        [
          {
            callID: "Choreography_0betnp1",
            address: undefined,
          },
        ],
        false,
      );

      verifyCallChoreography(
        CONTRACTS_PATH,
        "CallChoreo",
        ["Choreography_0betnp1"],
        1
      );
    });

    it("Data Call choreography to State Channel", async () => {
      await compileBpmn(
        parser,
        "call-choreo-datatask",
        [new CaseVariable("order", "uint", "0", false, "private")],
        [
          {
            callID: "Choreography_0betnp1",
            address: undefined,
          },
        ],
        false,
        true
      );

      verifyCallChoreography(
        CHANNEL_CONTRACTS_PATH,
        "CallChoreo",
        ["Choreography_0betnp1"],
        1
      );
    });

  });
});
