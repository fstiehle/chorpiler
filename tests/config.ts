import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BPMN_PATH = path.join(__dirname, "input", "bpmn");
export const CONTRACTS_PATH = path.join(__dirname, "output", "contracts");
