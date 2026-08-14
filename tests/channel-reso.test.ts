/**
 * Test suite for channel resolver contract execution
 */
import { network } from "hardhat";
import { beforeEach, describe, it, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { decodeEventLog } from "viem/utils";
import { encodeAbiParameters, keccak256 } from "viem";
import {
  debugLog,
  prepareContracts,
  updateAndRedeployContract,
  restoreContractFile,
  enact,
  EventProcessingContext,
  getTokenState,
  processEvent,
  hasSubChoreos,
  write,
} from "./helpers/execution-helpers.js";
import { CHANNEL_CONTRACTS_PATH } from "./config.js";

/**
 * Test suite for channel resolver execution functionality
 */
const { viem, networkHelpers, networkName } = await network.connect();
const client = await viem.getPublicClient();
const context = await prepareContracts(viem, CHANNEL_CONTRACTS_PATH);

export async function contractsFixture() {
  for (const contract of context.values()) {
    // Channel contracts are always instanced
    contract.contract = await viem.deployContract(contract.contractName);
  }
}

await networkHelpers.loadFixture(contractsFixture);
debugLog("Connected to client: " + networkName);

describe("Channel Resolver Tests", () => {
  // Deploy a single ChannelRoot for all channel tests
  let channelRoot: any;

  beforeEach(async () => {
    debugLog("Deploying ChannelRoot contract...");
    channelRoot = await viem.deployContract("ChannelRoot");
    debugLog(`ChannelRoot deployed at: ${channelRoot.address}`);
  });

  context.forEach((contractData) => {
    const { contractName, encoding, log, wallets, contract } = contractData;

    // Only test contracts that are channel contracts (encoding.isChannel === true)
    if (!encoding.isChannel) {
      return;
    }

    describe(`should execute channel contract: ${contractName}`, () => {
      let originalSolContent: string;
      let updatedContract: any;

      beforeEach(async () => {
        debugLog(`Setting up Channel Resolver test for ${contractName}...`);

        // Use the helper to update and redeploy with ChannelRoot address
        const result = await updateAndRedeployContract({
          contractName,
          contractPath: CHANNEL_CONTRACTS_PATH,
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

        originalSolContent = result.originalContent;
        updatedContract = result.updatedContract!;

        // Register the resolver with the ChannelRoot
        const channelData = {
          instanceID: 0n,
          participants: [...contractData.wallets.values()]
            .map((v) => v.account!.address)
            .filter(Boolean),
          resolveContract: updatedContract.address,
        };

        await write(client, contractData.wallets[0], channelRoot, 'register', [channelData]);
        debugLog(`Registered resolver ${contractName} with ChannelRoot`);
      });

      it(() => {})

      afterEach(async () => {
        // Restore original file content
        restoreContractFile(contractName, CHANNEL_CONTRACTS_PATH, originalSolContent);
      });
    });
  });
});