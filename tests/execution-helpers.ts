/**
 * Helper functions for contract execution tests
 */
import { readFileSync, readdirSync } from "fs";
import { network } from "hardhat";
import { strict as assert } from "node:assert";
import path from "path";
import { Client, PublicClient, WalletClient } from "viem";
import { TriggerEncoding } from "../src/Generator/Encoding/TriggerEncoding.js";
import { EventLog, InstanceDataChange } from "../src/util/EventLog/EventLog.js";
import { XESFastXMLParser } from "../src/util/EventLog/XESFastXMLParser.js";
import { capitalize } from "../src/util/helpers.js";
import { CONTRACTS_PATH, XES_PATH } from "./config.js";

interface ContractData {
  contractName: string;
  contract: any;
  encoding: TriggerEncoding;
  log: EventLog;
  wallets: WalletClient[];
}

const NR_NON_CONFORMING_TRACES = 2500;

export async function prepareContracts() {
  const { viem } = await network.connect();
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

    const contract: any | undefined = undefined;
    contracts.push({
      contractName,
      contract,
      encoding,
      log,
      wallets,
    });
  }

  return contracts;
}

export function genNonConformingLogs(log: EventLog, encoding: TriggerEncoding) {
  const badLog = EventLog.genNonConformingLog(
    log,
    encoding,
    NR_NON_CONFORMING_TRACES,
  );
  return badLog;
}

export async function getTokenState(client: PublicClient, contract: any) {
  return await client.readContract({
    address: contract.address,
    abi: contract.abi,
    functionName: "tokenState",
  });
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
  return await wallet.writeContractSync(request);
}

export async function dataSet(
  client: PublicClient,
  wallet: WalletClient,
  contract: any,
  dataChange: InstanceDataChange[],
) {
  for (const el of dataChange) {
    console.log(typeof el.val);
    const { request } = await client.simulateContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "set" + capitalize(el.variable),
      args: [el.val],
      account: wallet.account,
    });
    const receipt = await wallet.writeContractSync(request);
  }
}
