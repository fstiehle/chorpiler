import { network } from "hardhat";
import { strict as assert } from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { decodeEventLog } from "viem/utils";
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
  write,
  computeChannelID,
  computeInstanceID,
  buildCaseValues,
} from "./helpers/execution-helpers.js";
import { CONTRACTS_PATH, CHANNEL_CONTRACTS_PATH, TEST_MODE as CONFIG_TEST_MODE } from "./config.js";

const { viem, networkHelpers, networkName } = await network.connect();
const client = await viem.getPublicClient();
const runtimeMode = process.env.TEST_MODE ?? CONFIG_TEST_MODE ?? "default";
const contractsPath = runtimeMode === "channels" ? CHANNEL_CONTRACTS_PATH : CONTRACTS_PATH;
const context = await prepareContracts(viem, contractsPath);
let channelRoot: any;

export async function contractsFixture() {
  channelRoot = await viem.deployContract("ChannelRoot");
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

describe("Call Choreography Tests", () => {
  context.forEach((contractData) => {
    let { contractName, encoding, log, wallets, contract } = contractData;
    const instanceID = computeInstanceID(0, [...contractData.wallets.values()].map((v) => v.account!.address));
    // Only test contracts that have calls (encoding.calls.size > 0)
    if (encoding.calls.size === 0) {
      return;
    }

    describe(`should execute contract: ${contractName}`, () => {
      let originalSolContent: string;
      let updatedContract: any;

      beforeEach(async () => {
        debugLog(`Setting up Call Choreography test for ${contractName}...`);

        // Replace dummy address in contract
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

          // If the called contract is a channel resolver, prepare and register it
          if (callContract?.encoding.isChannel) {
            debugLog(`Preparing called channel resolver: ${callContractName}`);

            const res = await updateAndRedeployContract({
              contractName: callContractName,
              contractPath: contractsPath,
              viem,
              networkHelpers,
              contractsFixture,
              isInstanced: callContract.encoding.isInstanced === true,
              wallets: [...callContract.wallets.values()],
              replacements: [
                {
                  placeholder: /IChannelRoot\\s*\\(\\s*0x[0-9a-fA-F]{40}\\s*\\)/g,
                  address: channelRoot.address,
                  description: "IChannelRoot(ADDRESS)",
                },
              ],
            });

            const participants = [...callContract.wallets.values()]
              .map((v) => v.account!.address)
              .filter(Boolean) as `0x${string}`[];

            const channelData = {
              instanceID: computeInstanceID(0, participants),
              participants,
              resolveContract: callContract.contract.address,
            };

            debugLog(`Registering resolver ${callContractName} with ChannelRoot at ${channelRoot.address}`);
            await write(client, callContract.wallets[0], channelRoot, 'register', [channelData]);
            debugLog(`Registered resolver ${callContractName} with ChannelRoot`);
          }

        }

        // Use the helper to update and redeploy
        const result = await updateAndRedeployContract({
          contractName,
          contractPath: contractsPath,
          viem,
          networkHelpers,
          contractsFixture,
          isInstanced: encoding.isInstanced === true,
          wallets: [...contractData.wallets.values()],
          replacements,
        });

        originalSolContent = result.originalContent;
        contract = result.updatedContract || contractData.contract;

        if (encoding.isChannel) {
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
              tokenState: encoding.subModels
                ? new Array(encoding.subModels.size + 1).fill(0n)
                : 1n,
              index: 0n,
              ...caseValues,
            },
            signatures: [], // Might not work, might need to fake byte32
            OP_RETURN: "0x0000000000000000000000000000000000000000000000000000000000000000",
          }

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
          // console.log(updatedContract.address);

          const ccontext: EventProcessingContext = {
            client,
            wallets,
            contract,
            encoding,
            networkHelpers,
            instance: encoding.isInstanced ? instanceID : undefined
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
                    debugLog("NewInstance event detected:", emit);
                    const id = Number(emit.args.id);
                    const instance = emit.args.instanceID;

                    // Find the contract name by looking up the ID in encoding.calls
                    let contractName: string | undefined;
                    for (const [name, callInfo] of ccontext.encoding.calls) {
                      if (callInfo.id === id) {
                        contractName = name;
                        break;
                      }
                    }

                    if (!contractName) {
                      throw new Error(`NewInstance: contract id ${id} not found in encoding.calls`);
                    }

                    debugLog(`Found contract name for NewInstance: ${contractName}`);

                    // Get the contract data from the outer context
                    const contractData = context.get(contractName);
                    if (!contractData) {
                      throw new Error(`Contract data for ${contractName} not found in test context`);
                    }

                    if (encoding.isChannel) {
                      debugLog(`Trigger Dispute so we can replay trace on-chain`);
                      // Include case variables and their default values in the newState\
                      const caseValues = buildCaseValues(contractData.encoding);

                      const participants = [...contractData.wallets.values()]
                        .map((v) => v.account!.address);

                      const submitData = {
                        intsanceID: instance,
                        newState: {
                          tokenState: contractData.encoding.subModels
                            ? new Array(contractData.encoding.subModels.size + 1).fill(0n)
                            : 1n,
                          index: 0n,
                          ...caseValues,
                        },
                        signatures: [],
                        OP_RETURN: "0x0000000000000000000000000000000000000000000000000000000000000000",
                      }
                      const channelData = {
                        instanceID: instance,
                        participants: [...contractData.wallets.values()]
                          .map((v) => v.account!.address),
                        resolveContract: contractData.contract.address,
                      };
                      const channelID = computeChannelID(channelData.instanceID, channelData.participants, channelData.resolveContract)

                      await write(client, contractData.wallets[0], contractData.contract, 'submit', [channelID, submitData]);
                      debugLog(`Triggered dispute at ${contractName}`);

                      // Advance time by one day and one second to pass dispute window
                      await networkHelpers.time.increase(86400 + 1);
                      await networkHelpers.mine();
                    }

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
                        wallets: contractData.wallets,
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
                  }
                }

                assert(taskEventFound, `Task event ${event.id} (${event.name}) not emitted in blockchain logs`);
              }
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

      afterEach(async () => {
        // Restore original file content
        restoreContractFile(contractName, encoding.isChannel ? CHANNEL_CONTRACTS_PATH : CONTRACTS_PATH, originalSolContent);
      });
    });
  });
});
