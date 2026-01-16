/**
 * Test suite for process execution functionality
 */
import { network } from "hardhat";
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  prepareContracts,
  genNonConformingLogs,
  getTokenState,
  enact,
  dataSet,
} from "./execution-helpers.js";
import { Client } from "viem";

/**
 * Test suite for process execution functionality
 */
const { viem, networkHelpers } = await network.connect();
const client = await viem.getPublicClient();
const context = await prepareContracts();

describe("Execute all contracts by replaying xes logs in output/contracts", () => {
  async function contractsFixture() {
    for (const contract of context) {
      contract.contract = await viem.deployContract(contract.contractName, [
        [...contract.wallets.values()]
          .map((v) => v.account!.address)
          .filter(Boolean),
      ]);
    }
  }
  // Example usage of helper functions:
  // const tokenState = await getTokenState(client, contract);
  // await enact(client, wallets[0], contract, 1);
  // const nonConformingLog = genNonConformingLogs(log, encoding);
  describe("Replay logs", () => {
    context.forEach((contractData) => {
      describe(`should execute contract: ${contractData.contractName}`, async () => {
        await networkHelpers.loadFixture(contractsFixture);
        const { contractName, contract, encoding, log, wallets } = contractData;
        console.log(contract.address);

        log.traces.forEach((trace, i) => {
          it(`replay conforming trace ${i}`, async () => {
            for (const event of trace) {
              // Perform data change first, the event name might be a dummy name
              const participantID = encoding.participants.get(event.source);
              assert(
                participantID !== undefined,
                `source (participant) '${event.source}' for event '${event.name}' not found`,
              );
              if (event.dataChange) {
                dataSet(
                  client,
                  wallets[participantID],
                  contract,
                  event.dataChange,
                );
              }

              const taskID = encoding.tasks.get(event.id);
              //console.debug(`source '${event.source}' event '${event.name}'`)
              if (taskID !== undefined) {
                const preTokenState = await getTokenState(client, contract);
                console.debug("Try to Enact Task:", event.name, "ID:", taskID);
                await enact(client, wallets[participantID], contract, taskID);
                const postTokenState = await getTokenState(client, contract);
                // Expect that tokenState has changed!
                assert.notEqual(
                  preTokenState,
                  postTokenState,
                  `tokenState didn't change: was ${preTokenState}; is now ${postTokenState}.`,
                );
              }
            }
          });
        });
      });
    });
  });
});
