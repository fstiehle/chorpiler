import * as fs from "fs";
import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import path from "path";
import util from "util";
import { CaseVariable } from "../src/Generator/Encoding/Encoding.js";
import { TriggerEncoding } from "../src/Generator/Encoding/TriggerEncoding.js";
import SolDefaultContractGenerator from "../src/Generator/target/Sol/DefaultGenerator.js";
import SolStateChannelContractGenerator from "../src/Generator/target/Sol/StateChannelGenerator.js";
import { TemplateEngine } from "../src/Generator/TemplateEngine.js";
import { INetFastXMLParser } from "../src/Parser/FastXMLParser.js";
import { INetParser } from "../src/Parser/Parser.js";
import { BPMN_PATH, CONTRACTS_PATH } from "./config.js";

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

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
        const iNet = await parser.fromXML(data);

        // Special handling for sub-choreography2.bpmn, which needs unfold=false
        const isSubChoreography2 = bpmnFile === "sub-choreography2.bpmn";
        const result = await new SolDefaultContractGenerator(iNet[0]).compile({
          unfoldSubNets: !isSubChoreography2,
        });

        if (isSubChoreography2) {
          console.log(iNet);
        }

        const modelName = bpmnFile.replace(".bpmn", "");
        assert.ok(result, `Should successfully compile ${modelName} model`);
        assert.ok(result.target, "Should generate target contract code");
      });
    });
  });

  describe("Parse and compile cases", () => {
    const compileCase = async (
      generator: TemplateEngine,
      unfold: boolean = true,
      isStateChannel: boolean = false,
    ) => {
      const output = await generator.compile({
        unfoldSubNets: unfold,
        events: true,
        debug: true,
      });

      // Use default values if not provided
      const directory = CONTRACTS_PATH;

      const solFilePath = path.join(directory, `${generator.iNet.id}.sol`);
      const jsonFilePath = path.join(directory, `${generator.iNet.id}.json`);

      // Write the contract file
      await writeFile(solFilePath, output.target, { flag: "w+" });

      // Write the encoding file
      await writeFile(
        jsonFilePath,
        JSON.stringify(TriggerEncoding.toJSON(output.encoding)),
        { flag: "w+" },
      );

      // Verify the files were created
      assert.ok(
        fs.existsSync(solFilePath),
        `${generator.iNet.id} contract file should be created`,
      );
      assert.ok(
        fs.existsSync(jsonFilePath),
        `${generator.iNet.id} encoding file should be created`,
      );

      return output;
    };

    const compileBpmn = async (
      name: string,
      caseVariables?: CaseVariable[],
      unfold: boolean = true,
      isStateChannel: boolean = false,
    ) => {
      const data = await readFile(path.join(BPMN_PATH, `${name}.bpmn`));
      const iNet = await parser.fromXML(data);

      const generator = isStateChannel
        ? new SolStateChannelContractGenerator(iNet[0])
        : new SolDefaultContractGenerator(iNet[0]);

      // Add case variables if provided
      if (caseVariables && generator instanceof SolDefaultContractGenerator) {
        caseVariables.forEach((variable) =>
          generator.addCaseVariable(variable),
        );
      }

      return compileCase(generator, unfold, isStateChannel);
    };

    it("XOR-AND case to Sol Contract", async () => {
      await compileBpmn("xor-and", [
        new CaseVariable("items", "bool", "bool public items = false;", true),
      ]);
    });

    it("Pharmacy (out of order xml file) case to Sol Contract", async () => {
      await compileBpmn("out-of-order-xml");
    });

    it.skip("Pharmacy case to State Channel Root", async () => {
      await compileBpmn("out-of-order-xml", [], false, true);
    });

    it("Supply chain case to Sol Contract", async () => {
      await compileBpmn("supply-chain");
    });

    it.skip("Supply chain case to State Channel Root", async () => {
      await compileBpmn("supply-chain", [], false, true);
    });

    it("Incident Management case to Sol Contract", async () => {
      await compileBpmn("incident-management", [
        new CaseVariable(
          "resolved",
          "bool",
          "bool public resolved = false;",
          true,
        ),
      ]);
    });

    it.skip("Incident Management case to State Channel Root", async () => {
      await compileBpmn("incident-management", [], false, true);
    });

    it("Rental Agreement case to Sol Contract", async () => {
      await compileBpmn("rental-agreement", [
        new CaseVariable("bond", "int", "int public bond = 4000;", false),
        new CaseVariable(
          "weeklyRent",
          "int",
          "int public weeklyRent = 1000;",
          true,
        ),
      ]);
    });

    it("Pizza case to Sol Contract", async () => {
      await compileBpmn("pizza", [
        new CaseVariable("items", "bool", "bool public items = false;", true),
      ]);
    });

    it("Don't unfold Rental Agreement case to Sol Contract", async () => {
      await compileBpmn(
        "unfold-rental-agreement",
        [
          new CaseVariable("bond", "int", "int public bond = 4000;", false),
          new CaseVariable(
            "weeklyRent",
            "int",
            "int public weeklyRent = 1000;",
            true,
          ),
        ],
        false,
      );
    });

    it("Don't unfold Sub Choreo case to Sol Contract", async () => {
      await compileBpmn("sub-choreo", [], false);
    });

    it.only("Don't unfold Sub Choreo case to Sol Contract", async () => {
      await compileBpmn("sub-choreo-chained", [], false);
    });
  });
});
