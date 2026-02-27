/**
 * Test suite for process execution functionality
 */
import * as fs from "fs";
import { network } from "hardhat";
import { strict as assert } from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { decodeEventLog, getAddress } from "viem/utils";
import { spawn } from "child_process";
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

describe.only("Call Choreography Tests", () => {
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

        // Read the original Solidity file
        const solFilePath = path.join(CONTRACTS_PATH, `${contractName}.sol`);
        originalSolContent = fs.readFileSync(solFilePath, "utf8");

        // Create updated Solidity content with actual contract addresses
        let updatedSolContent = originalSolContent;

        // Replace placeholder addresses with actual deployed contract addresses
        for (const [callContractName] of encoding.calls) {
          const callContract = context.get(callContractName);
          if (callContract?.contract?.address) {
            const checksummedAddress = getAddress(
              callContract.contract.address,
            );
            const placeholder = `${callContractName}(0x0000000000000000000000000000000000000000)`;
            const replacement = `${callContractName}(${checksummedAddress})`;
            updatedSolContent = updatedSolContent.replace(
              placeholder,
              replacement,
            );
            debugLog(
              `Replaced ${callContractName} placeholder with address: ${checksummedAddress}`,
            );
          } else {
            console.warn(
              `Call contract ${callContractName} not found or not deployed`,
            );
          }
        }

        // Write updated content back to file
        if (updatedSolContent !== originalSolContent) {
          fs.writeFileSync(solFilePath, updatedSolContent);
          debugLog(
            `Updated ${contractName}.sol with actual contract addresses`,
          );

          // Compile the updated contract using hardhat
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
                reject(
                  new Error(`Hardhat compilation failed with code ${code}`),
                );
              }
            });
          });

          // Reset blockchain state to recompile
          await networkHelpers.loadFixture(contractsFixture);

          // Redeploy this specific contract with updated addresses
          updatedContract = await viem.deployContract(contractName, [
            [...contractData.wallets.values()]
              .map((v) => v.account!.address)
              .filter(Boolean),
          ]);

          debugLog(
            `Redeployed ${contractName} at address: ${updatedContract.address}`,
          );
        } else {
          // No changes needed, use existing contract
          updatedContract = contractData.contract;
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

      // afterEach(async () => {
      //   // Restore original file content
      //   if (originalSolContent) {
      //     const solFilePath = path.join(CONTRACTS_PATH, `${contractName}.sol`);
      //     fs.writeFileSync(solFilePath, originalSolContent);
      //     debugLog(`Restored original ${contractName}.sol file`);
      //   }

      //   // Reset blockchain state
      //   await networkHelpers.loadFixture(contractsFixture);
      // });
    });
  });
});
