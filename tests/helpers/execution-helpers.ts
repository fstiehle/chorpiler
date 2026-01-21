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

interface ContractData {
  contractName: string;
  contract: any;
  encoding: TriggerEncoding;
  log: EventLog;
  nonLog?: EventLog;
  wallets: WalletClient[];
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

export async function getTokenState(client: PublicClient, contract: any) {
  const val = await client.readContract({
    address: contract.address,
    abi: contract.abi,
    functionName: "tokenState",
  });
  return Number(val);
}

export async function enact(
  client: PublicClient,
  wallet: WalletClient,
  contract: any,
  taskID: number,
) {
  const { request } = await client.simulateContract({
    address: contract.address,
    abi: contract.abi,
    functionName: "enact",
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
    return new Error(
      `Transaction ${hash} was not found in the mempool. This may indicate a network issue or the transaction was rejected.`,
    );
  }

  const receipt = await Promise.race([
    client.waitForTransactionReceipt({ hash }),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Transaction timeout: ${hash} not mined after 10 seconds`,
            ),
          ),
        10000,
      ),
    ),
  ]);

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

    await Promise.race([
      client.waitForTransactionReceipt({ hash }),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `DataSet timeout: ${hash} not mined after 10 seconds for ${el.variable}`,
              ),
            ),
          10000,
        ),
      ),
    ]);

    //console.log(`DataSet transaction mined for ${el.variable}`);
  }
}

export async function isEnabled(
  client: PublicClient,
  contract: any,
  encoding: TriggerEncoding,
  taskModelId: string,
) {
  const state = await getTokenState(client, contract);
  return (
    encoding.states.has(state) &&
    encoding.states.get(state)!.includes(taskModelId)
  );
}
