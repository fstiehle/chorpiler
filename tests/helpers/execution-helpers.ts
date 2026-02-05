/**
 * Helper functions for contract execution tests
 */
import { readFileSync, readdirSync } from "fs";
import { strict as assert } from "node:assert";
import path from "path";
import { PublicClient, WalletClient } from "viem";
import { TriggerEncoding } from "../../src/Generator/Encoding/TriggerEncoding.js";
import {
  EventLog,
  InstanceDataChange,
} from "../../src/util/EventLog/EventLog.js";
import { XESFastXMLParser } from "../../src/util/EventLog/XESFastXMLParser.js";
import { capitalize } from "../../src/util/helpers.js";
import { CONTRACTS_PATH, XES_PATH } from "../config.js";
import { HardhatViemHelpers } from "@nomicfoundation/hardhat-viem/types";
import { DEBUG_MODE } from "./../config.js";
import { NetworkHelpers } from "@nomicfoundation/hardhat-network-helpers/types";

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
}

export interface EventProcessingHooks {
  beforeAssert?: (event: any, context: EventProcessingContext) => Promise<void>;
  afterAssert?: (
    event: any,
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

export async function processEvent(
  event: any,
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
    );
    return { success: false };
  }

  // Perform data change first, the event name might be a dummy name
  if (event.dataChange) {
    debugLog(`Processing ${event.dataChange.length} data changes`);
    await dataSet(client, wallets[participantID], contract, event.dataChange);
  }

  const task = encoding.tasks.get(event.id);
  if (!task) {
    console.warn(`event '${event.name}' not found!'`);
    return { success: false };
  }

  let functionName = "enact";
  const processID = task.processID;
  if (processID != 0) {
    // task is in a subChoreo, call it instead
    const subModuleName = encoding.subModels.get(Number(processID));
    if (subModuleName) {
      functionName = subModuleName.modelID;
    } else {
      console.warn(
        `SubModule with processID ${processID} not found, falling back to 'enact'`,
      );
    }
  }

  const preTokenState = await getTokenState(
    client,
    contract,
    hasSubChoreos(encoding) ? task.processID : null,
  );
  debugLog(
    `Trying to enact task: ${event.name} (Task ID: ${task.encoding}, Process ID: ${task.processID}), Pre-state: ${preTokenState}`,
  );

  if (hooks.beforeAssert) {
    await hooks.beforeAssert(event, context);
  }

  const receipt = await enact(
    client,
    wallets[participantID],
    contract,
    functionName,
    task.encoding,
  );

  const postTokenState = await getTokenState(
    client,
    contract,
    hasSubChoreos(encoding) ? task.processID : null,
  );
  debugLog(`Post-state: ${postTokenState} (changed from ${preTokenState})`);

  const result = { receipt, preTokenState, postTokenState };

  if (hooks.afterAssert) {
    await hooks.afterAssert(event, context, result);
  }

  return { success: true, ...result };
}

export async function prepareContracts(viem: HardhatViemHelpers) {
  const parser = new XESFastXMLParser();

  const contractNames = readdirSync(CONTRACTS_PATH, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".sol"))
    .map((dirent) => dirent.name.replace(".sol", ""));

  const contracts: ContractData[] = [];
  for (const contractName of contractNames) {
    const encoding = TriggerEncoding.fromJSON(
      JSON.parse(
        readFileSync(
          path.join(CONTRACTS_PATH, `${contractName}.json`),
        ).toString(),
      ),
    );
    assert(encoding.processID != null);
    const wallets = (await viem.getWalletClients()).slice(
      0,
      encoding.participants.size,
    );
    assert(encoding.participants.size === wallets.length);
    const log = await parser.fromXML(
      readFileSync(path.join(XES_PATH, `${contractName}.xes`)),
    );
    assert(log.traces.length !== 0);

    let nonLog: EventLog | undefined;
    try {
      nonLog = await parser.fromXML(
        readFileSync(
          path.join(XES_PATH, "nonconforming", `non_${contractName}.xes`),
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
    contracts.push({
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
) {
  if (processID != null) {
    const val = await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "tokenState",
      args: [processID],
    });
    return Number(val);
  } else {
    const val = await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "tokenState",
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
) {
  const { request } = await client.simulateContract({
    address: contract.address,
    abi: contract.abi,
    functionName,
    args: [taskID],
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
