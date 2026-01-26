/**
 * Test suite for process execution functionality
 */
import { network } from "hardhat";
import { afterEach, describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  getTokenState,
  enact,
  dataSet,
  prepareContracts,
  isEnabled,
} from "./helpers/execution-helpers.js";
import { DEBUG_MODE } from "./config.js";
import { decodeEventLog } from "viem/utils";

/**
 * Test suite for process execution functionality
 */
async function contractsFixture() {
  for (const contract of context) {
    contract.contract = await viem.deployContract(contract.contractName, [
      [...contract.wallets.values()]
        .map((v) => v.account!.address)
        .filter(Boolean),
    ]);
  }
}

// Debug logging configuration
const DEBUG =
  DEBUG_MODE ||
  process.env.DEBUG === "true" ||
  process.env.NODE_ENV === "debug";
const debugLog = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

const { viem, networkHelpers, networkName } = await network.connect();
const client = await viem.getPublicClient();
const testClient = await viem.getTestClient();
const context = await prepareContracts(viem);
await networkHelpers.loadFixture(contractsFixture);
debugLog("Connected to client: " + networkName);

describe("Execute all contracts by replaying xes logs in output/contracts", () => {
  // Example usage of helper functions:
  // const tokenState = await getTokenState(client, contract);
  // await enact(client, wallets[0], contract, 1);
  describe("Replay logs", () => {
    context.forEach((contractData) => {
      describe(`should execute contract: ${contractData.contractName}`, async () => {
        const { contractName, nonLog, contract, encoding, log, wallets } =
          contractData;
        assert(
          contract != undefined && contract.address != undefined,
          "contract is not set up, did you load the fixture?",
        );

        afterEach(async () => {
          debugLog(`Setting up blockchain ...`);
          await networkHelpers.loadFixture(contractsFixture);
        });

        log.traces.forEach((trace, i) => {
          it(`replay conforming trace ${i}`, async () => {
            debugLog(
              `Starting replay of trace ${i} for ${contractData.contractName}`,
            );
            for (const event of trace) {
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
              // Perform data change first, the event name might be a dummy name
              if (event.dataChange) {
                debugLog(`Processing ${event.dataChange.length} data changes`);
                await dataSet(
                  client,
                  wallets[participantID],
                  contract,
                  event.dataChange,
                );
              }

              const taskID = encoding.tasks.get(event.id);
              if (taskID !== undefined) {
                const preTokenState = await getTokenState(client, contract);
                debugLog(
                  `Trying to enact task: ${event.name} (Task ID: ${taskID}), Pre-state: ${preTokenState}`,
                );

                const receipt = await enact(
                  client,
                  wallets[participantID],
                  contract,
                  taskID,
                );
                assert(receipt != undefined && receipt.logs.length == 1);
                const emit: any = decodeEventLog({
                  abi: contract.abi,
                  data: receipt.logs[0].data,
                  topics: receipt.logs[0].topics,
                });
                assert(
                  emit.eventName == "Task" && Number(emit.args.id) == taskID,
                );
                const postTokenState = await getTokenState(client, contract);
                debugLog(
                  `Post-state: ${postTokenState} (changed from ${preTokenState})`,
                );
              } else {
                console.warn(`event '${event.name}' not found!'`);
              }
            }
            assert.equal(
              await getTokenState(client, contract),
              0,
              `end tokenState not 0!`,
            );
            debugLog(`✅ Completed replay of trace ${i} successfully`);
          });
        });

        nonLog?.traces.forEach((trace, i) => {
          it(`replay non-conforming trace ${i}`, async () => {
            let eventsRejected = 0;
            for (const event of trace) {
              // Perform data change first, the event name might be a dummy name
              const participantID = encoding.participants.get(event.source);
              assert(
                participantID !== undefined,
                `source (participant) '${event.source}' for event '${event.name}' not found`,
              );
              await networkHelpers.setBalance(
                wallets[participantID].account!.address,
                10n ** 18n,
              );
              if (event.dataChange) {
                debugLog(`Processing ${event.dataChange.length} data changes`);
                await dataSet(
                  client,
                  wallets[participantID],
                  contract,
                  event.dataChange,
                );
              }

              const taskID = encoding.tasks.get(event.id);
              if (taskID !== undefined) {
                const preTokenState = await getTokenState(client, contract);
                debugLog(
                  `Trying to enact task: ${event.name} (Task ID: ${taskID}), Pre-state: ${preTokenState}`,
                );

                const receipt = await enact(
                  client,
                  wallets[participantID],
                  contract,
                  taskID,
                );

                assert(receipt != undefined && receipt.logs);
                if (receipt.logs.length == 0) {
                  eventsRejected++;
                } else {
                  const emit: any = decodeEventLog({
                    abi: contract.abi,
                    data: receipt.logs[0].data,
                    topics: receipt.logs[0].topics,
                  });
                  if (emit.eventName != "Task") {
                    eventsRejected++;
                  }
                }

                const postTokenState = await getTokenState(client, contract);
                debugLog(
                  `Post-state: ${postTokenState} (changed from ${preTokenState})`,
                );
              } else {
                console.warn(`event '${event.name}' not found!'`);
              }
            }
            // Expect that at least one task was not enacted successfully (one non-conforming event)
            // or end event has not been reached (if only an event was removed, but no non-conforming was added)
            assert(
              eventsRejected > 0 ||
                !((await getTokenState(client, contract)) == 0),
              "Expect that at least one task was rejected or end event has not been reached",
            );
          });
        });
      });
    });
  });
});
