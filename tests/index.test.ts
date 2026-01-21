import { describe, it, after } from "node:test";
import { strict as assert } from "node:assert";
// also test some imports
import chorpiler, {
  InteractionNet,
  INetParser,
  TemplateEngine,
  TriggerEncoding,
} from "../src/index.js";
import * as fs from "fs";
import path from "path";
import { BPMN_PATH } from "./config.js";
import { CaseVariable } from "../src/Generator/Encoding/Encoding.js";

describe("NPM Package", () => {
  it("should be an object", () => {
    assert.strictEqual(typeof chorpiler, "object");
  });

  it("should have Parser, generators, and utils property", () => {
    assert.ok("Parser" in chorpiler);
    assert.ok("generators" in chorpiler);
    assert.ok("utils" in chorpiler);
  });

  it("should allow importing interfaces", () => {
    class test implements INetParser {
      fromXML(xml: Buffer): Promise<InteractionNet[]> {
        throw new Error("Method not implemented.");
      }
    }
    class test2 extends TemplateEngine {
      constructor(
        _iNet: InteractionNet,
        _caseVariables?: Map<string, CaseVariable>,
      ) {
        super(_iNet, "", _caseVariables);
      }
    }
  });

  describe("Parser", () => {
    it("should conform to parser interface", () => {
      const parser = new chorpiler.Parser();
      assert.strictEqual(typeof parser, "object");
      assert.strictEqual(typeof parser.fromXML, "function");
    });
  });

  describe("generators", () => {
    it("should have sol property", () => {
      const gens = chorpiler.generators;
      assert.ok("sol" in gens);
      assert.ok("DefaultContractGenerator" in gens.sol);
      assert.ok("StateChannelContractGenerator" in gens.sol);
    });

    it("should conform to template engine interface", () => {
      assert.strictEqual(
        typeof chorpiler.generators.sol.DefaultContractGenerator.prototype
          .compile,
        "function",
      );
      assert.strictEqual(
        typeof chorpiler.generators.sol.StateChannelContractGenerator.prototype
          .compile,
        "function",
      );
    });
  });
});

describe("readme code", () => {
  it("should run", async () => {
    const parser = new chorpiler.Parser();

    const bpmnXML = fs.readFileSync(path.join("./docs/examples/pizza.bpmn"));
    // parse BPMN file
    const iNet = await parser.fromXML(bpmnXML);

    const contractGenerator =
      new chorpiler.generators.sol.DefaultContractGenerator(iNet[0]);

    // compile to smart contract
    return contractGenerator
      .compile()
      .then((gen) => {
        fs.writeFileSync("Process.sol", gen.target, { flag: "w+" });
        // console.log("Process.sol generated.");
        assert(TriggerEncoding.toJSON(gen.encoding));
        // log encoding of participants and tasks,
        // console.log(TriggerEncoding.toJSON(gen.encoding));
        // can also be written to a .json file
      })
      .catch((err) => console.error(err));
  });

  it("should generate Process.sol", () => {
    assert.ok(fs.existsSync("Process.sol"));
  });

  after(() => {
    // cleanup
    fs.unlinkSync("Process.sol");
  });
});
