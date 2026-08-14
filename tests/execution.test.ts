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
  write,
  computeChannelID,
  computeInstanceID,
  buildCaseValues,
} from "./helpers/execution-helpers.js";
import { CONTRACTS_PATH, CHANNEL_CONTRACTS_PATH, TEST_MODE as CONFIG_TEST_MODE } from "./config.js";

const REPLAY_NON_CONFORMING = false;

/**
 * Test suite for process execution functionality
 */
const { viem, networkHelpers, networkName } = await network.connect();
const client = await viem.getPublicClient();
const testClient = await viem.getTestClient();
const runtimeMode = process.env.TEST_MODE ?? CONFIG_TEST_MODE ?? "default";
const contractsPath = runtimeMode === "channels" ? CHANNEL_CONTRACTS_PATH : CONTRACTS_PATH;
const context = await prepareContracts(viem, contractsPath);
let channelRoot: any;

export async function contractsFixture() {
  channelRoot = await viem.deployContract("ChannelRoot")
  debugLog(`ChannelRoot deployed at: ${channelRoot.address}`);

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
        let { contractName, nonLog, contract, encoding, log, wallets } =
          contractData;
        const instanceID = computeInstanceID(0, [...contractData.wallets.values()].map((v) => v.account!.address));
        assert(
          contract != undefined && contract.address != undefined,
          "contract is not set up, did you load the fixture?",
        );

        beforeEach(async () => {
          if (encoding.isChannel) {
            debugLog(`Contract is channel, redeploy with channel root address ...`);
            let originalSolContent: string;
            let updatedContract: any;

            // Use the helper to update and redeploy with ChannelRoot address
            const result = await updateAndRedeployContract({
              contractName,
              contractPath: contractsPath,
              viem,
              networkHelpers,
              contractsFixture,
              isInstanced: true, // Channel contracts are instanced, no constructor params
              replacements: [
                {
                  placeholder: /IChannelRoot\s*\(\s*0x[0-9a-fA-F]{40}\s*\)/g,
                  address: channelRoot.address,
                  description: "IChannelRoot(ADDRESS)",
                },
              ],
            });

            // originalSolContent = result.originalContent;
            if (result.updatedContract != null) {
              contract = result.updatedContract!;
            }
            const participants = [...contractData.wallets.values()]
              .map((v) => v.account!.address);

            debugLog(`${contractName} create new instance ...`);
            await write(client, contractData.wallets[0], contract, 'instance', [0, participants]);
            debugLog(`New instance created for ${contractName}`);


            // Register the resolver with the ChannelRoot
            const channelData = {
              instanceID: computeInstanceID(0, participants),
              participants,
              resolveContract: contract.address,
            };

            await write(client, contractData.wallets[0], channelRoot, 'register', [channelData]);
            const channelID = computeChannelID(channelData.instanceID, channelData.participants, channelData.resolveContract)

            // Verify the channel was stored
            const storedChannel = await channelRoot.read.getChannel([channelID]);
            assert.strictEqual(storedChannel.instanceID, channelData.instanceID, "Instance ID of registered channel with root should match");
            debugLog(`Registered resolver ${contractName} with ChannelRoot`);

            // Trigger Dispute so we can replay trace on-chain
            // Include case variables and their default values in the newState\
            const caseValues = buildCaseValues(encoding);

            const submitData = {
              intsanceID: channelData.instanceID,
              newState: {
                tokenState: encoding.subModels.size > 0
                  ? new Array(encoding.subModels.size + 1).fill(0n)
                  : 1n,
                index: 0n,
                ...caseValues,
              },
              signatures: [], // Might not work, might need to fake byte32
              OP_RETURN: "0x0000000000000000000000000000000000000000000000000000000000000000",
            }
            console.log(submitData)
            await write(client, contractData.wallets[0], contract, 'submit', [channelID, submitData]);
            debugLog(`Triggered dispute at ${contractName}`);

            // Advance time by one day and one second to pass dispute window
            await networkHelpers.time.increase(86400 + 1);
            await networkHelpers.mine();

          } else if (encoding.isInstanced) {

            debugLog(`${contractName} is instanced, create new instance ...`);
            await write(client, contractData.wallets[0], contract, 'instance', [0, [...contractData.wallets.values()]
              .map((v) => v.account!.address)]);
            debugLog(`New instance created for ${contractName}`);
          }
        });

        afterEach(async () => {
          debugLog(`Reloading blockchain state fixture ...`);
          await networkHelpers.loadFixture(contractsFixture);
        });

        log.traces.forEach((trace, i) => {
          it(`${contractName}: replay conforming trace ${i}`, async () => {
            // make a NOOP call to confirm deployment and to trigger any automated decisions
            // NOTE: this is to account for models implementing anti-patterns,
            // automated decisions pre task execution should be moved into the constructor.
            await enact(client, wallets[0], contract, "enact", 0, encoding.isInstanced ? instanceID : undefined);

            const context: EventProcessingContext = {
              client,
              wallets,
              contract,
              encoding,
              networkHelpers,
              instance: encoding.isInstanced ? instanceID : undefined
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
                encoding.isInstanced ? instanceID : undefined
              ),
              0,
              `end tokenState not 0!`,
            );

            if (hasSubChoreos(encoding)) {
              for (const [processID, subModel] of encoding.subModels) {
                assert.equal(
                  await getTokenState(client, contract, processID, encoding.isInstanced ? instanceID : undefined),
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
              await enact(client, wallets[0], contract, "enact", 0, encoding.isInstanced ? instanceID : undefined);

              const context: EventProcessingContext = {
                client,
                wallets,
                contract,
                encoding,
                networkHelpers,
                instance: encoding.isInstanced ? instanceID : undefined
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
                encoding.isInstanced ? instanceID : undefined
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
