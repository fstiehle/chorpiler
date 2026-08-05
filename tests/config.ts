import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log extra debug info during testing
export const DEBUG_MODE = true;

export const BPMN_PATH = path.join(__dirname, "input", "bpmn");
export const XES_PATH = path.join(__dirname, "input", "xes");
export const OUTPUT_PATH = path.join(__dirname, "output");
export const CONTRACTS_PATH = path.join(OUTPUT_PATH, "contracts");
export const CHANNEL_CONTRACTS_PATH = path.join(CONTRACTS_PATH, "channel");
