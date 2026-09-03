import { describe, it, after } from "node:test";
import { strict as assert } from "node:assert";
// also test some imports
import chorpiler, {
  SolDefaultContractGenerator,
  SolChannelContractGenerator,
  Parser,
  Simulator,
  EventLog,
  Trace,
  InteractionNet,
  INetParser,
  TemplateEngine,
  TriggerEncoding,
  XESFastXMLParser,
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

  it("should expose named exports for core classes", () => {
    // named exports should be available
    assert.strictEqual(typeof Parser, "function");
    assert.strictEqual(typeof SolDefaultContractGenerator, "function");
    assert.strictEqual(typeof SolChannelContractGenerator, "function");
    assert.strictEqual(typeof Simulator, "function");
    assert.strictEqual(typeof EventLog, "function");
    assert.strictEqual(typeof Trace, "function");
    assert.strictEqual(typeof XESFastXMLParser, "function");
  });

  it("default generators should match named exports", () => {
    // the convenience default should reference the same classes
    assert.strictEqual(
      chorpiler.generators.sol.DefaultContractGenerator,
      SolDefaultContractGenerator,
    );
    assert.strictEqual(
      chorpiler.generators.sol.ChannelContractGenerator,
      SolChannelContractGenerator,
    );
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
      ) {
        super(_iNet, "");
      }
    }
  });

  describe("Parser", () => {
    it("should conform to parser interface", () => {
      // test default import usage
      const parser = new chorpiler.Parser();
      assert.strictEqual(typeof parser, "object");
      assert.strictEqual(typeof parser.fromXML, "function");

      // test named import usage
      const parser2 = new Parser();
      assert.strictEqual(typeof parser2.fromXML, "function");
    });
  });

  describe("generators", () => {
    it("should have sol property", () => {
      const gens = chorpiler.generators;
      assert.ok("sol" in gens);
      assert.ok("DefaultContractGenerator" in gens.sol);
      assert.ok("ChannelContractGenerator" in gens.sol);
    });

    it("should conform to template engine interface", () => {
      assert.strictEqual(
        typeof chorpiler.generators.sol.DefaultContractGenerator.prototype
          .compile,
        "function",
      );
      assert.strictEqual(
        typeof chorpiler.generators.sol.ChannelContractGenerator.prototype
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

  it("should enable events and debug when provided options", async () => {
    const parser = new chorpiler.Parser();
    const bpmnXML = fs.readFileSync(path.join("./docs/examples/pizza.bpmn"));
    const iNet = await parser.fromXML(bpmnXML);

    // create channel-based generator with CompileOptions enabling events and debug
    const channelGen = new chorpiler.generators.sol.DefaultContractGenerator(iNet[0], false, {
      events: true,
      debug: "foundry",
    });

    // compile and print resulting solidity code to stdout as requested
    const gen = await channelGen.compile();
    // print to stdout for manual inspection / CI logs
    // eslint-disable-next-line no-console
    console.log('\n--- Generated Channel Contract ---\n');
    // eslint-disable-next-line no-console
    console.log(gen.target);
    // basic assertion: target should be a non-empty string
    assert.strictEqual(typeof gen.target, "string");
    assert.ok(gen.target.length > 0);

    // verify README claims: forge-std console import and event emission (emit) should appear
    assert.ok(
      gen.target.includes('import {console} from "forge-std/console.sol";'),
      'generated contract should import forge-std console.sol',
    );
    assert.ok(
      gen.target.includes('emit '),
      'generated contract should contain emit statements for events',
    );
  });

  it("should add a case variable to xor-messages and print the generated contract", async () => {
    const parser = new chorpiler.Parser();
    const bpmnXML = fs.readFileSync(path.join("./docs/examples/xor-messages.bpmn"));
    const iNet = await parser.fromXML(bpmnXML);

    const channelGen = new chorpiler.generators.sol.DefaultContractGenerator(iNet[0]);

    // add CaseVariable(name, type, defaultValue, setters, visibility)
    channelGen.addCaseVariable(new CaseVariable("items", "bool", "false", false, "public"));

    const gen = await channelGen.compile();

    // verify 'items' appears in the generated contract
    assert.ok(gen.target.includes('items'), 'generated contract should include the case variable name "items"');
    assert.ok(gen.target.includes('function ChoreographyTask_0hy9n0g(bool _items)'), 'generated contract should include the case variable task for "items"');
  });

  it("should generate Process.sol", () => {
    assert.ok(fs.existsSync("Process.sol"));
  });

  after(() => {
    // cleanup
    fs.unlinkSync("Process.sol");
  });
});
