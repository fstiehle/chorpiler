import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import util from "util";
import * as fs from "fs";
import { INetParser } from "../src/Parser/Parser.js";
import path from "path";
import { BPMN_PATH } from "./config.js";
import { INetFastXMLParser } from "../src/Parser/FastXMLParser.js";

const readFile = util.promisify(fs.readFile);

// Test Parsing works with all supported elements
// and parser reports unsupported elements
describe("Test BPMN choreography parsing", () => {
  describe("Parse with FastXMLParser", () => {
    let parser: INetParser;

    beforeEach(() => {
      parser = new INetFastXMLParser();
    });

    it("Parse model with XOR", async () => {
      const data = await readFile(path.join(BPMN_PATH, "xor.bpmn"));
      const result = await parser.fromXML(data);
      assert.ok(result, "Should successfully parse XOR model");
      assert.ok(
        Array.isArray(result),
        "Should return an array of interaction nets",
      );
    });

    it("Parse model with AND", async () => {
      const data = await readFile(path.join(BPMN_PATH, "and.bpmn"));
      const result = await parser.fromXML(data);
      assert.ok(result, "Should successfully parse AND model");
      assert.ok(
        Array.isArray(result),
        "Should return an array of interaction nets",
      );
    });

    it("Parse model with XOR Skip", async () => {
      const data = await readFile(path.join(BPMN_PATH, "xor-skip.bpmn"));
      const result = await parser.fromXML(data);
      assert.ok(result, "Should successfully parse XOR Skip model");
      assert.ok(
        Array.isArray(result),
        "Should return an array of interaction nets",
      );
    });

    it("Parse model with call choreography and report missing support", async () => {
      const data = await readFile(
        path.join(BPMN_PATH, "call-choreography.bpmn"),
      );

      await assert.rejects(
        async () => {
          await parser.fromXML(data);
        },
        /Unsupported Element/,
        "Should reject with 'Unsupported Element' error",
      );
    });

    it("Parse malformed model and report error", async () => {
      const data = await readFile(path.join(BPMN_PATH, "malformed.bpmn"));

      await assert.rejects(async () => {
        await parser.fromXML(data);
      }, "Should reject when parsing malformed model");
    });

    it("Parse model with XOR with missing default sequence flow and report error", async () => {
      const data = await readFile(path.join(BPMN_PATH, "xor-nodefault.bpmn"));

      await assert.rejects(async () => {
        await parser.fromXML(data);
      }, "Should reject when XOR is missing default sequence flow");
    });
  });
});
