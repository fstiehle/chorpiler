/**
 * Test suite for process execution functionality
 */
import { network } from "hardhat";
import { afterEach, beforeEach, describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  getTokenState,
  enact,
  dataSet,
  prepareContracts,
  isEnabled,
} from "./helpers/execution-helpers.js";
import { DEBUG_MODE } from "./config.js";

/**
 * Test suite for process execution functionality
 */
const { viem, networkHelpers, networkName } = await network.connect();
const client = await viem.getPublicClient();
const testClient = await viem.getTestClient();
const context = await prepareContracts(viem);
console.log("Connected to client: " + networkName);

// Debug logging configuration
const DEBUG =
  DEBUG_MODE ||
  process.env.DEBUG === "true" ||
  process.env.NODE_ENV === "debug";
const debugLog = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

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
  describe("Replay logs", () => {
    context.forEach((contractData) => {
      describe(`should execute contract: ${contractData.contractName}`, async () => {
        await networkHelpers.loadFixture(contractsFixture);
        const { contractName, nonLog, contract, encoding, log, wallets } =
          contractData;
        assert(
          contract != undefined && contract.address != undefined,
          "contract is not set up, did you load the fixture?",
        );

        afterEach(async () => {
          await networkHelpers.loadFixture(contractsFixture);
        });

        log.traces.forEach((trace, i) => {
          it(`replay conforming trace ${i}`, async () => {
            debugLog(
              `Starting replay of trace ${i} with ${trace.events.length} events`,
            );
            for (const event of trace) {
              debugLog(
                `Replaying event: ${event.name} (ID: ${event.id}) from participant: ${event.source}`,
              );
              // Perform data change first, the event name might be a dummy name
              const participantID = encoding.participants.get(event.source);
              assert(
                participantID !== undefined,
                `source (participant) '${event.source}' for event '${event.name}' not found`,
              );
              if (event.dataChange) {
                debugLog(`Processing ${event.dataChange.length} data changes`);
                dataSet(
                  client,
                  wallets[participantID],
                  contract,
                  event.dataChange,
                );
              }

              const taskID = encoding.tasks.get(event.id);
              if (taskID !== undefined) {
                assert(await isEnabled(client, contract, encoding, event.id));
                const preTokenState = await getTokenState(client, contract);
                debugLog(
                  `Enacting task: ${event.name} (Task ID: ${taskID}), Pre-state: ${preTokenState}`,
                );
                const receipt = await enact(
                  client,
                  wallets[participantID],
                  contract,
                  taskID,
                );

                const postTokenState = await getTokenState(client, contract);
                debugLog(
                  `Task completed. Post-state: ${postTokenState} (changed from ${preTokenState})`,
                );
                // Expect that tokenState has changed!
                assert.notEqual(
                  preTokenState,
                  postTokenState,
                  `tokenState didn't change: was ${preTokenState}; is now ${postTokenState}.`,
                );
              } else {
                console.warn(`event '${event.name}' not found!'`);
              }
            }
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
              if (event.dataChange != null) {
                debugLog(`Processing ${event.dataChange.length} data changes`);
                dataSet(
                  client,
                  wallets[participantID],
                  contract,
                  event.dataChange,
                );
              }

              const taskID = encoding.tasks.get(event.id);
              if (taskID !== undefined) {
                const preTokenState = await getTokenState(client, contract);
                if (await isEnabled(client, contract, encoding, event.id)) {
                  debugLog(
                    `Enacting task: ${event.name} (Task ID: ${taskID}). Pre-state: ${preTokenState}`,
                  );
                  const receipt = await enact(
                    client,
                    wallets[participantID],
                    contract,
                    taskID,
                  );
                } else {
                  eventsRejected++;

                  debugLog(
                    `Task: ${event.name} (Task ID: ${taskID}) is not enabled. Pre-state: ${preTokenState}`,
                  );
                }
              } else {
                console.warn(`event '${event.name}' not found!'`);
              }
            }
            // Expect that tokenState has at least NOT changed once (one non-conforming event)
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
