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

    describe("Parse models that should succeed", () => {
      const shouldSucceedPath = path.join(
        BPMN_PATH,
        "edgecases",
        "shouldsucceed",
      );
      const successFiles = fs
        .readdirSync(shouldSucceedPath)
        .filter((file) => file.endsWith(".bpmn"));

      successFiles.forEach((bpmnFile) => {
        it(`Parse ${bpmnFile} successfully`, async () => {
          const data = await readFile(path.join(shouldSucceedPath, bpmnFile));
          const result = await parser.fromXML(data);

          const modelName = bpmnFile.replace(".bpmn", "");
          assert.ok(result, `Should successfully parse ${modelName} model`);
          assert.ok(
            Array.isArray(result),
            "Should return an array of interaction nets",
          );
          assert.ok(
            result.length > 0,
            "Should contain at least one interaction net",
          );
        });
      });
    });

    describe("Parse models that should fail", () => {
      const shouldFailPath = path.join(BPMN_PATH, "edgecases", "shouldfail");
      const failFiles = fs
        .readdirSync(shouldFailPath)
        .filter((file) => file.endsWith(".bpmn"));

      failFiles.forEach((bpmnFile) => {
        it(`Parse ${bpmnFile} and expect error`, async () => {
          const data = await readFile(path.join(shouldFailPath, bpmnFile));

          try {
            // Check for specific error types based on file name
            if (bpmnFile.includes("call-choreography")) {
              await assert.rejects(
                async () => {
                  await parser.fromXML(data);
                },
                /Unsupported Element/,
                "Should reject with 'Unsupported Element' error",
              );
            } else if (bpmnFile.includes("xor-nodefault")) {
              await assert.rejects(
                async () => {
                  await parser.fromXML(data);
                },
                /XOR without an outgoing default flow/,
                "Should reject when XOR is missing default sequence flow",
              );
            } else if (bpmnFile.includes("malformed")) {
              await assert.rejects(
                async () => {
                  await parser.fromXML(data);
                },
                /malformed XML/,
                "Should reject when parsing malformed XML",
              );
            } else {
              await assert.rejects(
                async () => {
                  await parser.fromXML(data);
                },
                `Should reject when parsing ${bpmnFile.replace(".bpmn", "")} model`,
              );
            }
          } catch (error) {
            console.error(`Unexpected error in test for ${bpmnFile}:`, error);
            console.error(`Error details:`, {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : typeof error,
            });
            throw new Error(
              `Test failed for ${bpmnFile}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        });
      });
    });
  });
});
