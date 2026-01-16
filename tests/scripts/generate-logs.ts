import fs from "fs";
import path from "path";
import { Simulator } from "../../src/Simulator/Simulator.js";
import { BPMN_PATH, CONTRACTS_PATH, XES_PATH } from "../config.js";

const PREPEND = "sim_";

/**
 * Script to generate XES event logs and smart contracts for a specific BPMN file
 *
 * Usage:
 *   node --import tsx/esm generate-logs.ts <filename.bpmn>
 *   node --import tsx/esm generate-logs.ts process.bpmn
 *
 * This script:
 * 1. Takes a BPMN filename as command line argument
 * 2. Looks for the file in BPMN_PATH
 * 3. Generates XES event logs for the BPMN file
 * 4. Generates smart contracts (.sol) and encodings (.json) for the BPMN file
 * 5. Saves the XES files to CONTRACTS_PATH/xes
 * 6. Saves the contract files to CONTRACTS_PATH
 */

function printUsage() {
  console.log("Usage: node --import tsx/esm generate-logs.ts <filename.bpmn>");
  console.log("");
  console.log("Examples:");
  console.log("  node --import tsx/esm generate-logs.ts process.bpmn");
  console.log("  node --import tsx/esm generate-logs.ts workflow.bpmn");
  console.log("");
  console.log(
    "The script will look for the BPMN file in the configured BPMN_PATH.",
  );
}

async function generateForFile(filename: string) {
  console.log(`Starting generation for: ${filename}`);

  // Validate filename
  if (!filename.endsWith(".bpmn")) {
    console.error("Error: Filename must end with .bpmn");
    return false;
  }

  // Find the BPMN file
  const bpmnFilePath = path.join(BPMN_PATH, filename);

  if (!fs.existsSync(bpmnFilePath)) {
    console.error(`Error: File not found: ${bpmnFilePath}`);
    console.log(`Make sure the file exists in: ${BPMN_PATH}`);
    return false;
  }

  const bpmnDir = path.dirname(bpmnFilePath);
  const xesOutputDir = XES_PATH;
  const contractOutputDir = CONTRACTS_PATH;

  // Ensure output directories exist
  if (!fs.existsSync(xesOutputDir)) {
    fs.mkdirSync(xesOutputDir, { recursive: true });
    console.log(`Created XES output directory: ${xesOutputDir}`);
  }
  if (!fs.existsSync(contractOutputDir)) {
    fs.mkdirSync(contractOutputDir, { recursive: true });
    console.log(`Created contract output directory: ${contractOutputDir}`);
  }

  console.log(`Processing file: ${filename}`);
  console.log(`Source directory: ${bpmnDir}`);

  // List files in the directory for debugging
  const filesInDir = fs.readdirSync(bpmnDir);
  console.log(`Files in directory: ${filesInDir.join(", ")}`);

  // Create simulator with custom file filter
  const baseFilename = path.basename(filename);
  const simulator = new Simulator({
    bpmnDir: bpmnDir,
    xesDir: xesOutputDir,
    contractDir: contractOutputDir,
    fileFilter: (file) => {
      // console.log(
      //   `FileFilter checking: "${file}" === "${baseFilename}" = ${file === baseFilename}`,
      // );
      return file === baseFilename;
    },
  });

  let xesSuccess = false;
  let contractSuccess = false;

  // Generate XES logs
  console.log("\nGenerating XES event logs...");
  try {
    await simulator.generateLog(PREPEND, {
      maxTraces: 2500,
    });

    // Check if XES file was generated
    const baseName = path.basename(filename, ".bpmn");
    const expectedXesFile = path.join(xesOutputDir, `${baseName}.xes`);

    if (fs.existsSync(expectedXesFile)) {
      const stats = fs.statSync(expectedXesFile);
      console.log(
        `Generated XES file: ${baseName}.xes (${Math.round(stats.size / 1024)}KB)`,
      );
      xesSuccess = true;
    } else {
      console.log(`XES file not found: ${baseName}.xes`);
    }
  } catch (error) {
    console.error(
      `Error generating XES logs:`,
      error instanceof Error ? error.message : String(error),
    );
  }

  // Generate smart contracts
  console.log("\nGenerating smart contracts...");
  try {
    await simulator.generateContract(PREPEND, {
      unfoldSubNets: true,
      loopProtection: false,
      maxTraces: 2500,
    });

    // Check if contract files were generated
    const baseName = path.basename(filename, ".bpmn");
    const expectedSolFile = path.join(
      contractOutputDir,
      PREPEND,
      `${baseName}.sol`,
    );
    const expectedJsonFile = path.join(
      contractOutputDir,
      PREPEND,
      `${baseName}.json`,
    );

    if (fs.existsSync(expectedSolFile)) {
      const stats = fs.statSync(expectedSolFile);
      console.log(
        `Generated contract: ${baseName}.sol (${Math.round(stats.size / 1024)}KB)`,
      );

      if (fs.existsSync(expectedJsonFile)) {
        const jsonStats = fs.statSync(expectedJsonFile);
        console.log(
          `Generated encoding: ${baseName}.json (${Math.round(jsonStats.size / 1024)}KB)`,
        );
      }

      contractSuccess = true;
    } else {
      console.log(`Contract file not found: ${baseName}.sol`);
    }
  } catch (error) {
    console.error(
      `Error generating contracts:`,
      error instanceof Error ? error.message : String(error),
    );
  }

  // Summary
  console.log(`\nGeneration completed for: ${filename}`);
  console.log(`Summary:`);
  console.log(`   • XES generation: ${xesSuccess ? "Success" : "Failed"}`);
  console.log(
    `   • Contract generation: ${contractSuccess ? "Success" : "Failed"}`,
  );
  console.log(`   • XES output directory: ${xesOutputDir}`);
  console.log(`   • Contract output directory: ${contractOutputDir}`);

  return xesSuccess || contractSuccess;
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
