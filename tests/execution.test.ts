/**
 * Test suite for process execution functionality
 */
import { network } from "hardhat";
import { strict as assert } from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { decodeEventLog, getAddress } from "viem/utils";
import {
  debugLog,
  enact,
  EventProcessingContext,
  getTokenState,
  hasSubChoreos,
  prepareContracts,
  processEvent,
  updateAndRedeployContract,
  restoreContractFile,
} from "./helpers/execution-helpers.js";
import { CONTRACTS_PATH } from "./config.js";

const REPLAY_NON_CONFORMING = false;

/**
 * Test suite for process execution functionality
 */
const { viem, networkHelpers, networkName } = await network.connect();
const client = await viem.getPublicClient();
const testClient = await viem.getTestClient();
const context = await prepareContracts(viem, CONTRACTS_PATH);

export async function contractsFixture() {
  for (const contract of context.values()) {
    if (contract.encoding.isInstanced) {
      contract.contract = await viem.deployContract(contract.contractName);
    } else {
      contract.contract = await viem.deployContract(contract.contractName, [
        [...contract.wallets.values()]
          .map((v) => v.account!.address)
          .filter(Boolean),
      ]);
    }
  }
}
await networkHelpers.loadFixture(contractsFixture);
debugLog("Connected to client: " + networkName);

describe.only("Execute all contracts by replaying xes logs in output/contracts", () => {
  // Example usage of helper functions:
  // const tokenState = await getTokenState(client, contract);
  // await enact(client, wallets[0], contract, 1);
  describe("Replay logs", () => {
    context.forEach((contractData) => {
      // Skip contracts that have calls and are called contracts
      if (
        contractData.encoding.calls.size > 0 ||
        contractData.encoding.isCalled
      ) {
        return;
      }

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

          if (encoding.calls.size > 0) {
            for (const call of encoding.calls) {
              console.log(call);
            }
            // reparse and regenerate
            // update the file on disk, then rerun hardhat compile,
            // then deploy this contract singular, then only update contract
          }
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

        if (REPLAY_NON_CONFORMING) {
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
        }
      });
    });
  });
});

describe("Call Choreography Tests", () => {
  context.forEach((contractData) => {
    const { contractName, encoding, log, wallets, contract } = contractData;

    // Only test contracts that have calls (encoding.calls.size > 0)
    if (encoding.calls.size === 0) {
      return;
    }

    describe(`should execute contract: ${contractName}`, () => {
      let originalSolContent: string;
      let updatedContract: any;

      beforeEach(async () => {
        debugLog(`Setting up Call Choreography test for ${contractName}...`);

        // Build replacement patterns for all called contracts
        const replacements = [];
        for (const [callContractName] of encoding.calls) {
          const callContract = context.get(callContractName);
          if (callContract?.contract?.address) {
            replacements.push({
              placeholder: new RegExp(
                `${callContractName}\\s*\\(\\s*0x0000000000000000000000000000000000000000\\s*\\)`,
                "g"
              ),
              address: callContract.contract.address,
              description: `${callContractName}(ADDRESS)`,
            });
          } else {
            console.warn(
              `Call contract ${callContractName} not found or not deployed`
            );
          }
        }

        // Use the helper to update and redeploy
        const result = await updateAndRedeployContract({
          contractName,
          contractPath: CONTRACTS_PATH,
          viem,
          networkHelpers,
          contractsFixture,
          wallets: [...contractData.wallets.values()],
          replacements,
        });

        originalSolContent = result.originalContent;
        updatedContract = result.updatedContract || contractData.contract;
      });

      log.traces.forEach((trace, i) => {
        it(`${contractName}: replay conforming trace ${i}`, async () => {
          // make a NOOP call to confirm deployment and to trigger any automated decisions
          // NOTE: this is to account for models implementing anti-patterns,
          // automated decisions pre task execution should be moved into the constructor.
          await enact(client, wallets[0], updatedContract, "enact", 0);
          // console.log(updatedContract.address);

          const ccontext: EventProcessingContext = {
            client,
            wallets,
            contract: updatedContract,
            encoding,
            networkHelpers,
          };

          for (const event of trace) {
            const result = await processEvent(event, ccontext, {
              afterAssert: async (event, ccontext, result) => {
                // Conforming trace specific assertions
                assert(result.receipt != undefined);

                let taskEventFound = false;

                for (const log of result.receipt.logs) {
                  const emit: any = decodeEventLog({
                    abi: ccontext.contract.abi,
                    data: log.data,
                    topics: log.topics,
                  });

                  if (emit.eventName == "Task") {
                    assert(
                      Number(emit.args.id) ==
                        ccontext.encoding.tasks.get(event.id)!.encoding,
                    );
                    taskEventFound = true;
                  } else if (emit.eventName == "NewInstance") {
                    console.log("NewInstance event detected:", emit);
                    const id = Number(emit.args.id);
                    const instance = Number(emit.args.instanceID);

                    // Find the contract name by looking up the ID in encoding.calls
                    let contractName: string | undefined;
                    for (const [name, callInfo] of ccontext.encoding.calls) {
                      if (callInfo.id === id) {
                        contractName = name;
                        break;
                      }
                    }

                    if (contractName) {
                      console.log(
                        `Found contract name for NewInstance: ${contractName}`,
                      );

                      // Get the contract data from the outer context
                      const contractData = context.get(contractName);
                      if (contractData) {
                        console.log(
                          `Starting replay of ${contractName} log with ${contractData.log.traces.length} traces`,
                        );

                        // Replay the contract's log until the end
                        for (const trace of contractData.log.traces) {
                          console.log(
                            `Replaying trace with ${trace.events.length} events for ${contractName}`,
                          );

                          const instanceContext: EventProcessingContext = {
                            client: ccontext.client,
                            wallets: contractData.wallets, // TODO
                            contract: contractData.contract,
                            instance,
                            encoding: contractData.encoding,
                            networkHelpers: ccontext.networkHelpers,
                          };

                          for (const instanceEvent of trace) {
                            try {
                              console.log(1)
                              await processEvent(
                                instanceEvent,
                                instanceContext,
                              );
                            } catch (error) {
                              console.warn(
                                `Error replaying event ${instanceEvent.name} in ${contractName}:`,
                                error,
                              );
                            }
                          }
                        }

                        console.log(`Completed replay of ${contractName} log`);
                      } else {
                        console.warn(
                          `Contract data not found for: ${contractName}`,
                        );
                      }
                    } else {
                      console.warn(
                        `Contract name not found for NewInstance ID: ${id}`,
                      );
                    }
                  }
                }

                assert(taskEventFound, "Task event not found in logs");
              },
            });
          }
          assert.equal(
            await getTokenState(
              client,
              updatedContract,
              hasSubChoreos(encoding) ? 0 : null,
            ),
            0,
            `end tokenState not 0!`,
          );

          if (hasSubChoreos(encoding)) {
            for (const [processID, subModel] of encoding.subModels) {
              assert.equal(
                await getTokenState(client, updatedContract, processID),
                0,
                `subModel ${subModel.modelID} (processID: ${processID}) tokenState not 0!`,
              );
            }
          }
          debugLog(`✅ Completed replay of trace ${i} successfully`);
        });
      });

      afterEach(async () => {
        // Restore original file content
        restoreContractFile(contractName, CONTRACTS_PATH, originalSolContent);
      });
    });
  });
});
