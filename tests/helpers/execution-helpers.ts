/**
 * Helper functions for contract execution tests
 */
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { strict as assert } from "node:assert";
import path from "path";
import { spawn } from "child_process";
import { getAddress } from "viem/utils";
import { PublicClient, WalletClient } from "viem";
import {
  EventLog,
  Event,
  InstanceDataChange,
} from "../../src/util/EventLog/EventLog.js";
import { XESFastXMLParser } from "../../src/util/EventLog/XESFastXMLParser.js";
import { capitalize } from "../../src/util/helpers.js";
import { CONTRACTS_PATH, XES_PATH } from "../config.js";
import { HardhatViemHelpers } from "@nomicfoundation/hardhat-viem/types";
import { DEBUG_MODE } from "./../config.js";
import { NetworkHelpers } from "@nomicfoundation/hardhat-network-helpers/types";
import { TriggerEncoding } from "../../src/Generator/Encoding/JSON/TriggerEncoding.js";

export interface ContractData {
  contractName: string;
  contract: any;
  encoding: TriggerEncoding;
  log: EventLog;
  nonLog?: EventLog;
  wallets: WalletClient[];
}

// Modular event processing functions
export interface EventProcessingContext {
  client: PublicClient;
  wallets: WalletClient[];
  contract: any;
  encoding: TriggerEncoding;
  networkHelpers: NetworkHelpers<"generic">;
  instance?: number;
}

export interface EventProcessingHooks {
  beforeAssert?: (event: any, context: EventProcessingContext) => Promise<void>;
  afterAssert?: (
    event: Event,
    context: EventProcessingContext,
    result: any,
  ) => Promise<void>;
}

// Debug logging configuration
const DEBUG =
  DEBUG_MODE ||
  process.env.DEBUG === "true" ||
  process.env.NODE_ENV === "debug";
export const debugLog = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

/**
 * Options for updating and recompiling a contract
 */
export interface ContractUpdateOptions {
  contractName: string;
  contractPath: string;
  viem: HardhatViemHelpers;
  networkHelpers: NetworkHelpers<"generic">;
  contractsFixture: () => Promise<void>;
  wallets?: WalletClient[];
  replacements: Array<{
    placeholder: RegExp;
    address: string;
    description: string;
  }>;
}

/**
 * Updates a contract file with new addresses, recompiles it, and redeploys it.
 * Returns the original file content for restoration and the newly deployed contract.
 *
 * @param options - Configuration options for the contract update
 * @returns Object containing original content and updated contract
 */
export async function updateAndRedeployContract(
  options: ContractUpdateOptions
): Promise<{ originalContent: string; updatedContract: any }> {
  const {
    contractName,
    contractPath,
    viem,
    networkHelpers,
    contractsFixture,
    wallets,
    replacements,
  } = options;

  const solFilePath = path.join(contractPath, `${contractName}.sol`);
  const originalContent = readFileSync(solFilePath, "utf8");
  let updatedContent = originalContent;

  // Apply all replacements
  for (const { placeholder, address, description } of replacements) {
    const checksummedAddress = getAddress(address);
    updatedContent = updatedContent.replace(placeholder, description.replace("ADDRESS", checksummedAddress));
    debugLog(`Replaced ${description} with address: ${checksummedAddress}`);
  }

  // Only proceed if content changed
  if (updatedContent === originalContent) {
    debugLog(`No changes needed for ${contractName}.sol`);
    return { originalContent, updatedContract: null };
  }

  // Write updated content
  writeFileSync(solFilePath, updatedContent);
  debugLog(`Updated ${contractName}.sol with new addresses`);

  // Compile the updated contract
  debugLog(`Compiling updated ${contractName}.sol...`);
  await new Promise<void>((resolve, reject) => {
    const compile = spawn("npx", ["hardhat", "compile"], {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    compile.stdout.on("data", (data) => {
      debugLog(`Hardhat compile output: ${data}`);
    });

    compile.stderr.on("data", (data) => {
      debugLog(`Hardhat compile error: ${data}`);
    });

    compile.on("close", (code) => {
      if (code === 0) {
        debugLog(`Successfully compiled ${contractName}.sol`);
        resolve();
      } else {
        reject(new Error(`Hardhat compilation failed with code ${code}`));
      }
    });
  });

  // Reset blockchain state after recompile
  await networkHelpers.loadFixture(contractsFixture);

  // Redeploy the contract
  const updatedContract = wallets
    ? await viem.deployContract(contractName, [
        wallets.map((w) => w.account!.address).filter(Boolean),
      ])
    : await viem.deployContract(contractName);

  debugLog(
    `Redeployed ${contractName} at address: ${updatedContract.address}`
  );

  return { originalContent, updatedContract };
}

/**
 * Restores the original content of a contract file
 */
export function restoreContractFile(
  contractName: string,
  contractPath: string,
  originalContent: string
): void {
  if (originalContent) {
    const solFilePath = path.join(contractPath, `${contractName}.sol`);
    writeFileSync(solFilePath, originalContent);
    debugLog(`Restored original ${contractName}.sol file`);
  }
}

export async function processEvent(
  event: Event,
  context: EventProcessingContext,
  hooks: EventProcessingHooks = {},
): Promise<{
  success: boolean;
  receipt?: any;
  preTokenState?: number;
  postTokenState?: number;
}> {
  const { client, wallets, contract, encoding, networkHelpers } = context;

  debugLog(
    `Replaying event: ${event.name} (ID: ${event.id}) from participant: ${event.source}`,
  );

  const participantID = encoding.participants.get(event.source);
  assert(
    participantID !== undefined,
    `source (participant) '${event.source}' for event '${event.name}' not found`,
  );

  await networkHelpers.setBalance(
    wallets[participantID].account!.address,
    10n ** 18n,
  );

  if (event.name == "NooP") {
    const receipt = await enact(
      client,
      wallets[participantID],
      contract,
      "enact",
      0,
      context.instance,
    );
    return { success: false };
  }

  const task = encoding.tasks.get(event.id);
  const preTokenState = await getTokenState(
    client,
    contract,
    task && hasSubChoreos(encoding) ? task.processID : null,
    context.instance,
  );

  let dataTaskPerformed = false;
  let receipt = null;

  // Perform data change first, the event name might be a dummy name
  if (event.dataChange) {
    debugLog(`Processing ${event.dataChange.length} data changes`);
    // Check for a data task
    if (task && task.hasDataTask) {
      debugLog(
        `Processing data task: ${event.name} (Task ID: ${task.encoding}, Process ID: ${task.processID}), Pre-state: ${preTokenState}`,
      );
      receipt = await dataTask(client, wallets[participantID], contract, event);
      dataTaskPerformed = true;
    }
    if (!dataTaskPerformed) {
      // compatibility for setter contracts
      debugLog(`Processing data setting`);
      await dataSet(client, wallets[participantID], contract, event.dataChange);
    }
  }

  if (!task) {
    console.warn(`event '${event.name}' not found!'`);
    return { success: false };
  }

  const functionName = getFunctionNameForTask(task, encoding);

  if (hooks.beforeAssert) {
    await hooks.beforeAssert(event, context);
  }

  // skip if task was already performed as part of a data task
  if (!dataTaskPerformed) {
    debugLog(
      `Trying to enact task: ${event.name} (Task ID: ${task.encoding}, Process ID: ${task.processID}), Pre-state: ${preTokenState}`,
    );
    receipt = await enact(
      client,
      wallets[participantID],
      contract,
      functionName,
      task.encoding,
      context.instance,
    );
  }

  const postTokenState = await getTokenState(
    client,
    contract,
    hasSubChoreos(encoding) ? task.processID : null,
    context.instance,
  );
  debugLog(`Post-state: ${postTokenState} (changed from ${preTokenState})`);

  assert(receipt !== undefined);
  const result = { receipt, preTokenState, postTokenState };

  if (hooks.afterAssert) {
    await hooks.afterAssert(event, context, result);
  }

  return { success: true, ...result };
}

export async function prepareContracts(
  viem: HardhatViemHelpers,
  contractPath: string,
) {
  const parser = new XESFastXMLParser();

  const contractNames = readdirSync(contractPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".sol"))
    .map((dirent) => dirent.name.replace(".sol", ""));

  const contracts: Map<string, ContractData> = new Map();
  for (const contractName of contractNames) {
    const encoding = TriggerEncoding.fromJSON(
      JSON.parse(
        readFileSync(
          path.join(contractPath, `${contractName}.json`),
        ).toString(),
      ),
    );
    assert(encoding.processID != null);
    const wallets = (await viem.getWalletClients()).slice(
      0,
      encoding.participants.size,
    );
    assert(encoding.participants.size === wallets.length);

    // Strip 'ChannelResolver' prefix if present for XES log lookup
    const baseContractName = contractName.startsWith('ChannelResolver')
      ? contractName.replace('ChannelResolver', '')
      : contractName;
    const logName = `${baseContractName}.xes`;
    const log = await parser.fromXML(
      readFileSync(path.join(XES_PATH, logName)),
    );
    assert(log.traces.length !== 0);

    let nonLog: EventLog | undefined;
    try {
      nonLog = await parser.fromXML(
        readFileSync(
          path.join(XES_PATH, "nonconforming", `non_${baseContractName}.xes`),
        ),
      );
      assert(nonLog.traces.length !== 0);
    } catch {
      console.warn(
        `Non-conforming log not found for ${contractName}. ` +
          `Expected at: ${path.join(XES_PATH, "nonconforming", `non_${contractName}.xes`)}. ` +
          `Consider generating it using the generate-nonlogs script.`,
      );
    }

    const contract: any | undefined = undefined;
    contracts.set(contractName, {
      contractName,
      contract,
      encoding,
      log,
      nonLog,
      wallets,
    });
  }

  return contracts;
}

export async function getTokenState(
  client: PublicClient,
  contract: any,
  processID: number | null,
  instanceID?: number,
) {
  const args = instanceID !== undefined ? [instanceID] : [];

  if (processID != null) {
    const val = await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getTokenState",
      args,
      // args: [processID], could be used in the future, if sub chore state is made accessible
    });
    return Number(val);
  } else {
    const val = await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getTokenState",
      args,
    });
    return Number(val);
  }
}

export async function enact(
  client: PublicClient,
  wallet: WalletClient,
  contract: any,
  functionName: string,
  taskID: number,
  instanceID?: number,
) {
  const args = instanceID !== undefined ? [instanceID, taskID] : [taskID];

  const { request } = await client.simulateContract({
    address: contract.address,
    abi: contract.abi,
    functionName,
    args,
    account: wallet.account,
  });

  //console.log(`Submitting enact transaction for taskID: ${taskID}`);
  const hash = await wallet.writeContract(request);
  //console.log(`Transaction submitted with hash: ${hash}`);

  try {
    // Check if transaction exists before waiting
    const tx = await client.getTransaction({ hash });
    //console.log(`Transaction found in mempool: ${tx.hash}`);
  } catch (error) {
    console.warn(`Transaction not found immediately: ${hash}`);
    // Try to resubmit or handle gracefully
    throw new Error(
      `Transaction ${hash} was not found in the mempool. This may indicate a network issue or the transaction was rejected.`,
    );
  }
  const receipt = await (async () => {
    let timer: NodeJS.Timeout;
    return Promise.race([
      client.waitForTransactionReceipt({ hash }),
      new Promise<null>(
        (_, reject) =>
          (timer = setTimeout(
            () =>
              reject(
                new Error(
                  `Transaction timeout: ${hash} not mined after 2 seconds`,
                ),
              ),
            2000,
          )),
      ),
    ]).finally(() => clearTimeout(timer));
  })();
  return receipt;
}

export async function dataSet(
  client: PublicClient,
  wallet: WalletClient,
  contract: any,
  dataChange: InstanceDataChange[],
) {
  for (const el of dataChange) {
    const { result, request } = await client.simulateContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "set" + capitalize(el.variable),
      args: [el.val],
      account: wallet.account,
    });

    const hash = await wallet.writeContract(request);
    //console.log(`DataSet transaction submitted: ${hash}`);

    try {
      // Check if transaction exists before waiting
      const tx = await client.getTransaction({ hash });
      //console.log(`DataSet transaction found: ${tx.hash}`);
    } catch (error) {
      console.warn(`DataSet transaction not found: ${hash}`);
      return new Error(
        `DataSet transaction ${hash} was not found in the mempool for variable ${el.variable}`,
      );
    }

    const receipt = await (async () => {
      let timer: NodeJS.Timeout;
      return Promise.race([
        client.waitForTransactionReceipt({ hash }),
        new Promise<null>(
          (_, reject) =>
            (timer = setTimeout(
              () =>
                reject(
                  new Error(
                    `Transaction timeout: ${hash} not mined after 2 seconds`,
                  ),
                ),
              2000,
            )),
        ),
      ]).finally(() => clearTimeout(timer));
    })();

    //console.log(`DataSet transaction mined for ${el.variable}`);
  }
}

export async function dataTask(
  client: PublicClient,
  wallet: WalletClient,
  contract: any,
  event: Event,
) {
  if (event.dataChange == null) {
    return
  }
  for (const el of event.dataChange) {
    const { result, request } = await client.simulateContract({
      address: contract.address,
      abi: contract.abi,
      functionName: event.id,
      args: [el.val],
      account: wallet.account,
    });

    const hash = await wallet.writeContract(request);
    //console.log(`DataSet transaction submitted: ${hash}`);

    try {
      // Check if transaction exists before waiting
      const tx = await client.getTransaction({ hash });
      //console.log(`DataSet transaction found: ${tx.hash}`);
    } catch (error) {
      console.warn(`DataSet transaction not found: ${hash}`);
      return new Error(
        `DataSet transaction ${hash} was not found in the mempool for variable ${el.variable}`,
      );
    }

    const receipt = await (async () => {
      let timer: NodeJS.Timeout;
      return Promise.race([
        client.waitForTransactionReceipt({ hash }),
        new Promise<null>(
          (_, reject) =>
            (timer = setTimeout(
              () =>
                reject(
                  new Error(
                    `Transaction timeout: ${hash} not mined after 2 seconds`,
                  ),
                ),
              2000,
            )),
        ),
      ]).finally(() => clearTimeout(timer));
    })();
    return receipt;
    //console.log(`DataTask transaction mined for ${el.variable}`);
  }
}

// isEnabled will report false for a task if it is behind an automated gateway where the process is currently halted.
// this can happen in two situations:
//  1. The gateway is at the start of the process (bad practice: make the decision in the constructor if possible).
//  2. The task is on an ELSE branch of the gateway, which will only gey activated when the task is enacted
//    (bad practice: switch the default branch so it is the non-blocking branch).
// (note: in the meantime the other alternative branch conditions could still become true).
// In both cases, the task would get enabled "on the way" and suceed, even though isEnabled returns false.
// This could be prevented by first simulating a NOOP transaction and then simulating the actual transaction,
// if the tokenState changed after the second transaction, the task execution went through.
// In practice, its easier to avoid these situations in the model.
export async function isEnabled(
  client: PublicClient,
  contract: any,
  encoding: TriggerEncoding,
  taskModelID: string,
) {
  const task = encoding.tasks.get(taskModelID);
  if (!task) throw Error(`Task ${taskModelID} not found`);
  const state = await getTokenState(
    client,
    contract,
    hasSubChoreos(encoding) ? task.processID : null,
  );
  if (hasSubChoreos(encoding)) {
    const subModel = encoding.subModels.get(task.processID);
    if (!subModel) throw Error(`SubModel ${task.processID} not found`);
    if (!subModel.states.has(taskModelID)) return false;
    const req_state = subModel.states.get(taskModelID)!;
    return (state & req_state) == req_state;
  }
  if (!encoding.states.has(taskModelID)) return false;
  const req_state = encoding.states.get(taskModelID)!;
  return (state & req_state) == req_state;
}

export function hasSubChoreos(encoding: TriggerEncoding) {
  return encoding.subModels && encoding.subModels.size > 0;
}

/**
 * Determines the function name to call based on the task's process ID.
 * Returns 'enact' for main process tasks, or the sub-choreography model ID for sub-process tasks.
 */
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

export async function getEnabled(
  client: PublicClient,
  contract: any,
  encoding: TriggerEncoding,
  subChoreography: number | null = null,
) {
  const state = await getTokenState(client, contract, subChoreography);

  const enabled: string[] = [];

  for (const [modelID, req_state] of encoding.states) {
    if ((state & req_state) === req_state) {
      enabled.push(modelID);
    }
  }

  return enabled;
}
