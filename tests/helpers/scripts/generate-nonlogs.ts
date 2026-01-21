import fs from "fs";
import path from "path";
import { XES_PATH, CONTRACTS_PATH } from "../../config.js";
import { TriggerEncoding } from "../../../src/index.js";
import { XESFastXMLParser } from "../../../src/util/EventLog/XESFastXMLParser.js";
import { FuzzyLog } from "../../../src/Simulator/FuzzyLog.js";

const PREPEND = "sim_non_";
const NR_NON_CONFORMING_TRACES = 2500;

const parser = new XESFastXMLParser();

/**
 * Script to generate non-conforming XES event logs for a specific BPMN file
 *
 * Usage:
 *   node --import tsx/esm generate-logs.ts <filename.bpmn>
 *   node --import tsx/esm generate-logs.ts process.bpmn
 *
 */

function printUsage() {
  console.log(
    "Usage: node --import tsx/esm generate-nonlogs.ts <filename.xes>",
  );
  console.log("");
  console.log("Examples:");
  console.log("  node --import tsx/esm generate-logs.ts process.xes");
  console.log("  node --import tsx/esm generate-logs.ts workflow.xes");
  console.log("");
  console.log(
    "The script will look for the BPMN file in the configured BPMN_PATH.",
  );
}

async function generateForFile(filename: string) {
  console.log(`Starting generation for: ${filename}`);

  // Validate filename
  if (!filename.endsWith(".xes")) {
    console.error("Error: Filename must end with .xes");
    return false;
  }

  // Find the XES file
  const xesFilePath = path.join(XES_PATH, filename);

  if (!fs.existsSync(xesFilePath)) {
    console.error(`Error: File not found: ${xesFilePath}`);
    console.log(`Make sure the file exists in: ${XES_PATH}`);
    return false;
  }

  // Find the corresponding encoding file
  const baseName = path.basename(filename, ".xes");
  const encodingFilePath = path.join(CONTRACTS_PATH, `${baseName}.json`);

  if (!fs.existsSync(encodingFilePath)) {
    console.error(`Error: Encoding file not found: ${encodingFilePath}`);
    console.log(`Make sure the encoding file exists in: ${CONTRACTS_PATH}`);
    return false;
  }

  console.log(`Processing XES file: ${filename}`);
  console.log(`Using encoding: ${baseName}.json`);

  let xesSuccess = false;

  // Load the original XES log
  console.log("\nLoading XES event log...");
  try {
    const xesData = fs.readFileSync(xesFilePath);
    const log = await parser.fromXML(xesData);
    console.log(`Loaded log with ${log.traces.length} traces`);

    // Load the encoding
    console.log("Loading encoding...");
    const encodingData = fs.readFileSync(encodingFilePath, "utf8");
    const encoding = TriggerEncoding.fromJSON(JSON.parse(encodingData));
    console.log(`Loaded encoding for process: ${encoding.processID}`);

    // Generate non-conforming logs using FuzzyLog class
    console.log(
      `\nGenerating ${NR_NON_CONFORMING_TRACES} non-conforming traces...`,
    );

    const fuzzyLog = new FuzzyLog({ outputDir: XES_PATH });
    const nonConformingLog = fuzzyLog.generateAndWriteNonConformingLog(
      log,
      encoding,
      `${PREPEND}${baseName}`,
      NR_NON_CONFORMING_TRACES,
    );

    // Check if the file was successfully generated
    const outputFileName = `${PREPEND}${baseName}.xes`;
    const outputFilePath = path.join(XES_PATH, outputFileName);

    if (fs.existsSync(outputFilePath)) {
      const stats = fs.statSync(outputFilePath);
      console.log(
        `Generated non-conforming XES file: ${outputFileName} (${Math.round(stats.size / 1024)}KB)`,
      );
      console.log(
        `Generated ${nonConformingLog.traces.length} non-conforming traces`,
      );
      xesSuccess = true;
    } else {
      console.error(`Failed to create output file: ${outputFilePath}`);
      xesSuccess = false;
    }
  } catch (error) {
    console.error(
      `Error generating non-conforming logs:`,
      error instanceof Error ? error.message : String(error),
    );
  }

  // Summary
  console.log(`\nGeneration completed for: ${filename}`);
  console.log(`Summary:`);
  console.log(
    `   • Non-conforming XES generation: ${xesSuccess ? "Success" : "Failed"}`,
  );
  console.log(`   • Output directory: ${XES_PATH}`);
  console.log(
    `   • Output file: ${xesSuccess ? `${PREPEND}${baseName}.xes` : "N/A"}`,
  );

  return xesSuccess;
}

// Parse command line arguments
const args = process.argv.slice(2);

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  if (args.length === 0) {
    console.error("Error: No filename provided");
    console.log("");
    printUsage();
    process.exit(1);
  }

  if (args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const filename = args[0];

  generateForFile(filename)
    .then((success) => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

export { generateForFile };
