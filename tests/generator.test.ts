import { describe, it, before, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import * as fs from "fs";
import { INetParser } from "../src/Parser/Parser.js";
import util from "util";
import { TemplateEngine } from "../src/Generator/TemplateEngine.js";
import path from "path";
import { BPMN_PATH, CONTRACTS_PATH } from "./config.js";
import { INetFastXMLParser } from "../src/Parser/FastXMLParser.js";
import SolDefaultContractGenerator from "../src/Generator/target/Sol/DefaultGenerator.js";
import SolStateChannelContractGenerator from "../src/Generator/target/Sol/StateChannelGenerator.js";
import { TriggerEncoding } from "../src/Generator/Encoding/TriggerEncoding.js";
import { CaseVariable } from "../src/Generator/Encoding/Encoding.js";

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const compileCase = async (
  generator: TemplateEngine,
  outputPath: string,
  caseLabel: string,
) => {
  const output = await generator.compile(true);

  await writeFile(
    path.join(outputPath.replace(".sol", "_encoding.json")),
    JSON.stringify(TriggerEncoding.toJSON(output.encoding)),
    { flag: "w+" },
  );

  return writeFile(
    path.join(outputPath),
    // need to append a label to the contract name as otherwise waffle will error when compiling
    // multiple contracts with the same name
    output.target.replace("contract ", "contract " + caseLabel),
    { flag: "w+" },
  );
};

// Test Parsing and Generation works with all supported elements without unexpected errors
describe("Test Parsing and Generation", () => {
  let parser: INetParser;

  beforeEach(() => {
    parser = new INetFastXMLParser();
  });

  describe("Parse correct BPMN and generate Sol Contracts", () => {
    it("Compile model with simple seq flow", async () => {
      const data = await readFile(path.join(BPMN_PATH, "seq-flow.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile seq flow model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with XOR that allows to skip to the end event to Sol contract", async () => {
      const data = await readFile(path.join(BPMN_PATH, "xor-skip.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile XOR skip model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with AND to Sol contract", async () => {
      const data = await readFile(path.join(BPMN_PATH, "and.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile AND model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with XOR to Sol contract", async () => {
      const data = await readFile(path.join(BPMN_PATH, "xor.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile XOR model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with long (7 consecutive) seq flows to Sol contract", async () => {
      const data = await readFile(path.join(BPMN_PATH, "seq-flow-7.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile seq-flow-7 model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with uncontrolled merge of seq flows to Sol contract", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "uncontrolled-flow.bpmn"),
      );
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile uncontrolled flow model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with sub choreographies to Sol contract", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "sub-choreography.bpmn"),
      );
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile sub choreography model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with sub choreographies to Sol contract that separates the instance state (unfold=false)", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "sub-choreography2.bpmn"),
      );
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile(
        false,
      );
      assert.ok(result, "Should successfully compile sub choreography2 model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with XOR followed by AND to Sol contract", async () => {
      // Should be reduced properly, according to Rule (i)
      const data = await readFile(path.join(BPMN_PATH, "xor-and.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile XOR-AND model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with event-based gateway", async () => {
      const data = await readFile(path.join(BPMN_PATH, "event.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile event model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with a Loop to Sol contract", async () => {
      const data = await readFile(path.join(BPMN_PATH, "loop.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile loop model");
      assert.ok(result.target, "Should generate target contract code");
    });

    it("Compile model with a lot of XOR skips to Sol contract", async () => {
      const data = await readFile(path.join(BPMN_PATH, "skip.bpmn"));
      const iNet = await parser.fromXML(data);
      const result = await new SolDefaultContractGenerator(iNet[0]).compile();
      assert.ok(result, "Should successfully compile skip model");
      assert.ok(result.target, "Should generate target contract code");
    });
  });

  describe("Parse and compile Pizza Case", () => {
    before(() => {
      if (!fs.existsSync(path.join(CONTRACTS_PATH, "pizza"))) {
        fs.mkdirSync(path.join(CONTRACTS_PATH, "pizza"), { recursive: true });
      }
    });

    it("to Sol Contract", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "/cases/pizza/pizza.bpmn"),
      );
      const contract = new SolDefaultContractGenerator(
        (await parser.fromXML(data))[0],
      );
      contract.addCaseVariable(
        new CaseVariable("items", "bool", "bool public items = false;", true),
      );

      await compileCase(
        contract,
        path.join(CONTRACTS_PATH, "/pizza/PIZZA_ProcessExecution.sol"),
        "PIZZA_",
      );

      // Verify the files were created
      assert.ok(
        fs.existsSync(
          path.join(CONTRACTS_PATH, "/pizza/PIZZA_ProcessExecution.sol"),
        ),
        "Pizza contract file should be created",
      );
      assert.ok(
        fs.existsSync(
          path.join(
            CONTRACTS_PATH,
            "/pizza/PIZZA_ProcessExecution_encoding.json",
          ),
        ),
        "Pizza encoding file should be created",
      );
    });
  });

  describe("Parse and compile pharmacy (out of order xml file) case", () => {
    before(() => {
      if (!fs.existsSync(path.join(CONTRACTS_PATH, "out-of-order"))) {
        fs.mkdirSync(path.join(CONTRACTS_PATH, "out-of-order"), {
          recursive: true,
        });
      }
    });

    it("to Sol Contract", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "/cases/out-of-order/out-of-order-xml.bpmn"),
      );

      await compileCase(
        new SolDefaultContractGenerator((await parser.fromXML(data))[0]),
        path.join(CONTRACTS_PATH, "/out-of-order/PH_ProcessExecution.sol"),
        "PH_",
      );

      // Verify the files were created
      assert.ok(
        fs.existsSync(
          path.join(CONTRACTS_PATH, "/out-of-order/PH_ProcessExecution.sol"),
        ),
        "PH contract file should be created",
      );
      assert.ok(
        fs.existsSync(
          path.join(
            CONTRACTS_PATH,
            "/out-of-order/PH_ProcessExecution_encoding.json",
          ),
        ),
        "PH encoding file should be created",
      );
    });

    it.skip("to State Channel Root", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "/cases/out-of-order/out-of-order-xml.bpmn"),
      );

      await compileCase(
        new SolStateChannelContractGenerator((await parser.fromXML(data))[0]),
        path.join(CONTRACTS_PATH, "/out-of-order/PH_ProcessChannel.sol"),
        "PH_",
      );
    });
  });

  describe("Parse and compile supply chain case", () => {
    before(() => {
      if (!fs.existsSync(path.join(CONTRACTS_PATH, "supply-chain"))) {
        fs.mkdirSync(path.join(CONTRACTS_PATH, "supply-chain"), {
          recursive: true,
        });
      }
    });

    it("to Sol Contract", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "/cases/supply-chain/supply-chain.bpmn"),
      );

      await compileCase(
        new SolDefaultContractGenerator((await parser.fromXML(data))[0]),
        path.join(CONTRACTS_PATH, "/supply-chain/SC_ProcessExecution.sol"),
        "SC_",
      );

      // Verify the files were created
      assert.ok(
        fs.existsSync(
          path.join(CONTRACTS_PATH, "/supply-chain/SC_ProcessExecution.sol"),
        ),
        "SC contract file should be created",
      );
      assert.ok(
        fs.existsSync(
          path.join(
            CONTRACTS_PATH,
            "/supply-chain/SC_ProcessExecution_encoding.json",
          ),
        ),
        "SC encoding file should be created",
      );
    });

    it.skip("to State Channel Root", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "/cases/supply-chain/supply-chain.bpmn"),
      );

      await compileCase(
        new SolStateChannelContractGenerator((await parser.fromXML(data))[0]),
        path.join(CONTRACTS_PATH, "/supply-chain/SC_ProcessChannel.sol"),
        "SC_",
      );
    });
  });

  describe("Parse and compile Incident Management Case", () => {
    before(() => {
      if (!fs.existsSync(path.join(CONTRACTS_PATH, "incident-management"))) {
        fs.mkdirSync(path.join(CONTRACTS_PATH, "incident-management"), {
          recursive: true,
        });
      }
    });

    it("to Sol Contract", async () => {
      const data = await readFile(
        path.join(
          BPMN_PATH,
          "/cases/incident-management/incident-management.bpmn",
        ),
      );

      const contract = new SolDefaultContractGenerator(
        (await parser.fromXML(data))[0],
      );
      contract.addCaseVariable(
        new CaseVariable(
          "resolved",
          "bool",
          "bool public resolved = false;",
          true,
        ),
      );

      await compileCase(
        contract,
        path.join(
          CONTRACTS_PATH,
          "/incident-management/IM_ProcessExecution.sol",
        ),
        "IM_",
      );

      // Verify the files were created
      assert.ok(
        fs.existsSync(
          path.join(
            CONTRACTS_PATH,
            "/incident-management/IM_ProcessExecution.sol",
          ),
        ),
        "IM contract file should be created",
      );
      assert.ok(
        fs.existsSync(
          path.join(
            CONTRACTS_PATH,
            "/incident-management/IM_ProcessExecution_encoding.json",
          ),
        ),
        "IM encoding file should be created",
      );
    });

    it.skip("to State Channel Root", async () => {
      const data = await readFile(
        path.join(
          BPMN_PATH,
          "/cases/incident-management/incident-management.bpmn",
        ),
      );

      await compileCase(
        new SolStateChannelContractGenerator((await parser.fromXML(data))[0]),
        path.join(CONTRACTS_PATH, "/incident-management/IM_ProcessChannel.sol"),
        "IM_",
      );
    });
  });

  describe("Parse and compile Rental Agreement Case", () => {
    before(() => {
      if (!fs.existsSync(path.join(CONTRACTS_PATH, "rental-agreement"))) {
        fs.mkdirSync(path.join(CONTRACTS_PATH, "rental-agreement"), {
          recursive: true,
        });
      }
    });

    it("to Sol Contract", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "/cases/rental-agreement/rental-agreement.bpmn"),
      );
      const contract = new SolDefaultContractGenerator(
        (await parser.fromXML(data))[0],
      );
      contract.addCaseVariable(
        new CaseVariable("bond", "int", "int public bond = 4000;", false),
      );
      contract.addCaseVariable(
        new CaseVariable(
          "weeklyRent",
          "int",
          "int public weeklyRent = 1000;",
          true,
        ),
      );

      await compileCase(
        contract,
        path.join(CONTRACTS_PATH, "/rental-agreement/RA_ProcessExecution.sol"),
        "RA_",
      );

      // Verify the files were created
      assert.ok(
        fs.existsSync(
          path.join(
            CONTRACTS_PATH,
            "/rental-agreement/RA_ProcessExecution.sol",
          ),
        ),
        "RA contract file should be created",
      );
      assert.ok(
        fs.existsSync(
          path.join(
            CONTRACTS_PATH,
            "/rental-agreement/RA_ProcessExecution_encoding.json",
          ),
        ),
        "RA encoding file should be created",
      );
    });
  });

  describe("Parse and compile xor-and Case", () => {
    before(() => {
      if (!fs.existsSync(path.join(CONTRACTS_PATH, "xor-and"))) {
        fs.mkdirSync(path.join(CONTRACTS_PATH, "xor-and"), { recursive: true });
      }
    });

    it("to Sol Contract", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "/cases/xor-and/xor-and.bpmn"),
      );
      const contract = new SolDefaultContractGenerator(
        (await parser.fromXML(data))[0],
      );
      contract.addCaseVariable(
        new CaseVariable("items", "bool", "bool public items = false;", true),
      );

      await compileCase(
        contract,
        path.join(CONTRACTS_PATH, "/xor-and/XA_ProcessExecution.sol"),
        "XA_",
      );

      // Verify the files were created
      assert.ok(
        fs.existsSync(
          path.join(CONTRACTS_PATH, "/xor-and/XA_ProcessExecution.sol"),
        ),
        "XA contract file should be created",
      );
      assert.ok(
        fs.existsSync(
          path.join(
            CONTRACTS_PATH,
            "/xor-and/XA_ProcessExecution_encoding.json",
          ),
        ),
        "XA encoding file should be created",
      );
    });
  });
});
