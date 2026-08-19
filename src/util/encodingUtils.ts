import { TriggerEncoding } from "../Generator/Encoding/JSON/TriggerEncoding.js";

export function getFunctionNameForTask(
  task: { processID: number },
  encoding: TriggerEncoding,
): string {
  const processID = task.processID;
  if (processID === 0) {
    return "enact";
  }

  // task is in a subChoreo, call it instead
  const subModuleName = encoding.subModels.get(Number(processID));
  if (subModuleName) {
    return subModuleName.modelID;
  }

  console.warn(
    `SubModule with processID ${processID} not found, falling back to 'enact'`,
  );
  return "enact";
}

