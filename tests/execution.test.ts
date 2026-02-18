/**
 * Test suite for process execution functionality
 */
import { network } from "hardhat";
import { strict as assert } from "node:assert";
import { afterEach, describe, it } from "node:test";
import { decodeEventLog } from "viem/utils";
import {
  debugLog,
  enact,
  EventProcessingContext,
  getTokenState,
  hasSubChoreos,
  prepareContracts,
  processEvent,
} from "./helpers/execution-helpers.js";
import { CONTRACTS_PATH } from "./config.js";
import path from "node:path";

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

async function callContractsFixture() {
  for (const contract of callChoreoContext) {
    if (contract.encoding.isCalled) {
      continue
    }
    const deployedMainContract = await viem.deployContract(contract.contractName, [
      [...contract.wallets.values()]
        .map((v) => v.account!.address)
        .filter(Boolean),
    ]);
    const callAddresses = new Array<string>
    for (const callId of contract.encoding.calls.values()) {
      // Find the contract that matches this call ID
      const calledContract = callChoreoContext.find(c => c.encoding.processID === callId);
      if (calledContract) {
        // Deploy the called contract first
        calledContract.contract = await viem.deployContract(calledContract.contractName, [
          [...calledContract.wallets.values()]
            .map((v) => v.account!.address)
            .filter(Boolean),
          deployedMainContract.address
        ]);
        callAddresses.push(calledContract.contract.address);
        contract.contract = deployedMainContract;
      } else {
        throw Error(`Called contract with processID ${callId} not found`);
      }
    }
    contract.contract = await viem.deployContract(contract.contractName, [
      [...contract.wallets.values()]
        .map((v) => v.account!.address)
        .filter(Boolean),
      callAddresses,
    ]);
  }
}

const { viem, networkHelpers, networkName } = await network.connect();
const client = await viem.getPublicClient();
const testClient = await viem.getTestClient();
const context = await prepareContracts(viem, CONTRACTS_PATH);
await networkHelpers.loadFixture(contractsFixture);
debugLog("Connected to client: " + networkName);

describe("Execute all contracts by replaying xes logs in output/contracts", () => {
  // Example usage of helper functions:
  // const tokenState = await getTokenState(client, contract);
  // await enact(client, wallets[0], contract, 1);
  describe("Replay logs", () => {
    context
      .filter((contractData) => !contractData.encoding.isCalled)
      .forEach((contractData) => {
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
            it(`${contractName}: replay conforming trace ${i}`, async () => {
              // make a NOOP call to confirm deployment and to trigger any automated decisions
              // NOTE: this is to account for models implementing anti-patterns,
              // automated decisions pre task execution should be moved into the constructor.
              await enact(client, wallets[0], contract, "enact", 0);

              const context: EventProcessingContext = {
                client,
                wallets,
                contract,
                encoding,
                networkHelpers,
              };

              for (const event of trace) {
                const result = await processEvent(event, context, {
                  afterAssert: async (event, context, result) => {
                    // Conforming trace specific assertions
                    assert(
                      result.receipt != undefined &&
                        result.receipt.logs.length == 1,
                    );
                    const emit: any = decodeEventLog({
                      abi: context.contract.abi,
                      data: result.receipt.logs[0].data,
                      topics: result.receipt.logs[0].topics,
                    });
                    assert(
                      emit.eventName == "Task" &&
                        Number(emit.args.id) ==
                          context.encoding.tasks.get(event.id)!.encoding,
                    );
                  },
                });
              }
              assert.equal(
                await getTokenState(
                  client,
                  contract,
                  hasSubChoreos(encoding) ? 0 : null,
                ),
                0,
                `end tokenState not 0!`,
              );

              if (hasSubChoreos(encoding)) {
                for (const [processID, subModel] of encoding.subModels) {
                  assert.equal(
                    await getTokenState(client, contract, processID),
                    0,
                    `subModel ${subModel.modelID} (processID: ${processID}) tokenState not 0!`,
                  );
                }
              }
              debugLog(`✅ Completed replay of trace ${i} successfully`);
            });
          });

          nonLog?.traces.forEach((trace, i) => {
            it(`${contractName}: replay non-conforming trace ${i}`, async () => {
              // make a NOOP call to confirm deployment and to trigger any automated decisions
              // NOTE: this is to account for models implementing anti-patterns,
              // automated decisions pre task execution should be moved into the constructor.
              await enact(client, wallets[0], contract, "enact", 0);

              const context: EventProcessingContext = {
                client,
                wallets,
                contract,
                encoding,
                networkHelpers,
              };

              let eventsRejected = 0;

              for (const event of trace) {
                const result = await processEvent(event, context, {
                  afterAssert: async (event, context, result) => {
                    // Non-conforming trace specific logic
                    assert(result.receipt != undefined && result.receipt.logs);
                    if (result.receipt.logs.length == 0) {
                      eventsRejected++;
                    } else {
                      const emit: any = decodeEventLog({
                        abi: context.contract.abi,
                        data: result.receipt.logs[0].data,
                        topics: result.receipt.logs[0].topics,
                      });
                      if (emit.eventName != "Task") {
                        eventsRejected++;
                      }
                    }
                  },
                });
              }

              // Expect that at least one task was not enacted successfully (one non-conforming event)
              // or end event has not been reached (if only an event was removed, but no non-conforming was added)
              const endTokenStat = await getTokenState(
                client,
                contract,
                hasSubChoreos(encoding) ? 0 : null,
              );

              assert(
                eventsRejected > 0 || endTokenStat != 0,
                "Expect that at least one task was rejected or end event has not been reached",
              );
              debugLog(
                `✅ Non-Conforming trace rejected. Rejected tasks: ${eventsRejected}, state: ${endTokenStat}`,
              );
            });
          });
        });
      });
  });
});

const callChoreoContext = await prepareContracts(
  viem,
  path.join(CONTRACTS_PATH, "callchoreos"),
);
await networkHelpers.loadFixture(callContractsFixture);

describe("Execute all Call-Choreo contracts by replaying xes logs in output/contracts/callchoreos", () => {
  describe("Replay logs", () => {
    callChoreoContext
      .f((or)
      Each((contractData) => {



                describe(`should execute contract: ${contractData.contractName}`, async () => {
          const { contractName, nonLog, contract, encoding, log, wallets } =
            contractData;
          assert(
            contract != undefined && contract.address != undefined,
            "contract is not set up, did you load the fixture?",
          );

          afterEach(async () => {
            debugLog(`Setting up blockchain ...`);
            await networkHelpers.loadFixture(callContractsFixture);
          });

          log.traces.forEach((trace, i) => {
            it(`${contractName}: replay conforming trace ${i}`, async () => {
              // make a NOOP call to confirm deployment and to trigger any automated decisions
              // NOTE: this is to account for models implementing anti-patterns,
              // automated decisions pre task execution should be moved into the constructor.
              await enact(client, wallets[0], contract, "enact", 0);

              const context: EventProcessingContext = {
                client,
                wallets,
                contract,
                encoding,
                networkHelpers,
              };

              for (const event of trace) {
                const result = await processEvent(event, context, {
                  afterAssert: async (event, context, result) => {
                    // Conforming trace specific assertions
                    assert(
                      result.receipt != undefined &&
                        result.receipt.logs.length == 1,
                    );
                    const emit: any = decodeEventLog({
                      abi: context.contract.abi,
                      data: result.receipt.logs[0].data,
                      topics: result.receipt.logs[0].topics,
                    });
                    assert(
                      emit.eventName == "Task" &&
                        Number(emit.args.id) ==
                          context.encoding.tasks.get(event.id)!.encoding,
                    );
                  },
                });
              }
              assert.equal(
                await getTokenState(
                  client,
                  contract,
                  hasSubChoreos(encoding) ? 0 : null,
                ),
                0,
                `end tokenState not 0!`,
              );

              if (hasSubChoreos(encoding)) {
                for (const [processID, subModel] of encoding.subModels) {
                  assert.equal(
                    await getTokenState(client, contract, processID),
                    0,
                    `subModel ${subModel.modelID} (processID: ${processID}) tokenState not 0!`,
                  );
                }
              }
              debugLog(`✅ Completed replay of trace ${i} successfully`);
            });
          });

          nonLog?.traces.forEach((trace, i) => {
            it(`${contractName}: replay non-conforming trace ${i}`, async () => {
              // make a NOOP call to confirm deployment and to trigger any automated decisions
              // NOTE: this is to account for models implementing anti-patterns,
              // automated decisions pre task execution should be moved into the constructor.
              await enact(client, wallets[0], contract, "enact", 0);

              const context: EventProcessingContext = {
                client,
                wallets,
                contract,
                encoding,
                networkHelpers,
              };

              let eventsRejected = 0;

              for (const event of trace) {
                const result = await processEvent(event, context, {
                  afterAssert: async (event, context, result) => {
                    // Non-conforming trace specific logic
                    assert(result.receipt != undefined && result.receipt.logs);
                    if (result.receipt.logs.length == 0) {
                      eventsRejected++;
                    } else {
                      const emit: any = decodeEventLog({
                        abi: context.contract.abi,
                        data: result.receipt.logs[0].data,
                        topics: result.receipt.logs[0].topics,
                      });
                      if (emit.eventName != "Task") {
                        eventsRejected++;
                      }
                    }
                  },
                });
              }

              // Expect that at least one task was not enacted successfully (one non-conforming event)
              // or end event has not been reached (if only an event was removed, but no non-conforming was added)
              const endTokenStat = await getTokenState(
                client,
                contract,
                hasSubChoreos(encoding) ? 0 : null,
              );

              assert(
                eventsRejected > 0 || endTokenStat != 0,
                "Expect that at least one task was rejected or end event has not been reached",
              );
              debugLog(
                `✅ Non-Conforming trace rejected. Rejected tasks: ${eventsRejected}, state: ${endTokenStat}`,
              );
            });
          });
        });
      });
  });
});
