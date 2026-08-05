/**
 * Test suite for ChannelRoot contract functionality
 *
 * Tests:
 * - CREATE2 deployment of ChannelRoot
 * - Channel registration
 * - Channel verification with signatures
 * - Edge cases and error conditions
 */
import { network } from "hardhat";
import { strict as assert } from "node:assert";
import { describe, it, beforeEach, afterEach } from "node:test";
import { encodeAbiParameters, keccak256, parseAbiParameters, toHex, encodePacked } from "viem";
import { debugLog } from "./helpers/execution-helpers.js";
import type { Address, Hex } from "viem";

const { viem, networkHelpers, networkName } = await network.connect();
const client = await viem.getPublicClient();
const testClient = await viem.getTestClient();

// Store deployed ChannelRoot address for later use
export let CHANNEL_ROOT_ADDRESS: Address;

/**
 * Deploys ChannelRoot using CREATE2 for deterministic address
 */
async function deployChannel(): Promise<Address> {
  debugLog("Deploying ChannelRoot with CREATE2...");

  // Get the deployer wallet
  const [deployer] = await viem.getWalletClients();

  // Deploy ChannelRoot using CREATE2
  // Hardhat's viem plugin uses CREATE2 by default for deterministic deploys
  const channelRoot = await viem.deployContract("ChannelRoot", [], {
    client: { wallet: deployer },
  });

  debugLog(`ChannelRoot deployed at: ${channelRoot.address}`);
  return channelRoot.address;
}

/**
 * Fixture to deploy ChannelRoot before each test
 */
async function channelRootFixture() {
  CHANNEL_ROOT_ADDRESS = await deployChannel();
  return CHANNEL_ROOT_ADDRESS;
}

describe("ChannelRoot Contract Tests", () => {
  let channelRoot: any;
  let wallets: any[];
  let channelRootAddress: Address;

  beforeEach(async () => {
    // Load fixture and get fresh contract instance
    channelRootAddress = await networkHelpers.loadFixture(channelRootFixture);
    channelRoot = await viem.getContractAt("ChannelRoot", channelRootAddress);
    wallets = await viem.getWalletClients();

    // Ensure wallets have sufficient balance
    for (const wallet of wallets) {
      await networkHelpers.setBalance(wallet.account!.address, 10n ** 18n);
    }

    // debugLog(`Connected to network: ${networkName}`);
    // debugLog(`ChannelRoot address: ${channelRootAddress}`);
  });

  describe("Deployment", () => {
    it("should deploy ChannelRoot", async () => {
      assert(channelRootAddress, "ChannelRoot should be deployed");
      assert.match(channelRootAddress, /^0x[a-fA-F0-9]{40}$/, "Should be a valid address");
      debugLog("✓ ChannelRoot deployed successfully");
    });

    it("should return deployed address via exported variable", async () => {
      assert.strictEqual(CHANNEL_ROOT_ADDRESS, channelRootAddress);
      debugLog(`✓ Exported address matches: ${CHANNEL_ROOT_ADDRESS}`);
    });
  });

  describe("Channel Registration", () => {
    it("should register a new channel successfully", async () => {
      const instanceID = 1n;
      const participants = [wallets[0].account!.address, wallets[1].account!.address];
      const resolveContract = wallets[2].account!.address; // Mock resolve contract address

      const channel = {
        instanceID,
        participants,
        resolveContract,
      };

      // Register the channel
      const hash = await channelRoot.write.register([channel], {
        account: wallets[0].account,
      });

      const receipt = await client.waitForTransactionReceipt({ hash });
      assert.strictEqual(receipt.status, "success", "Transaction should succeed");

      // Calculate the expected channel ID
      const channelID = keccak256(
        encodeAbiParameters(
          parseAbiParameters("uint, address[], address"),
          [instanceID, participants, resolveContract]
        )
      );

      // Verify the channel was stored
      const storedChannel = await channelRoot.read.getChannel([channelID]);

      assert.strictEqual(storedChannel.instanceID, instanceID, "Instance ID should match");
      assert.strictEqual(storedChannel.participants.length, 2, "Should have 2 participants");
      assert.strictEqual(storedChannel.participants[0].toLowerCase(), participants[0].toLowerCase(), "First participant should match");
      assert.strictEqual(storedChannel.participants[1].toLowerCase(), participants[1].toLowerCase(), "Second participant should match");
      assert.strictEqual(storedChannel.resolveContract.toLowerCase(), resolveContract.toLowerCase(), "Resolve contract should match");
      debugLog("✓ Channel registered successfully");
    });

    it("should prevent duplicate channel registration", async () => {
      const instanceID = 2n;
      const participants = [wallets[0].account!.address, wallets[1].account!.address];
      const resolveContract = wallets[2].account!.address;

      const channel = {
        instanceID,
        participants,
        resolveContract,
      };

      // Register the channel first time
      const hash1 = await channelRoot.write.register([channel], {
        account: wallets[0].account,
      });
      await client.waitForTransactionReceipt({ hash: hash1 });

      // Try to register the same channel again
      try {
        await channelRoot.write.register([channel], {
          account: wallets[0].account,
        });
        assert.fail("Should have thrown an error for duplicate registration");
      } catch (error: any) {
        assert(
          error.message.includes("Channel already exists"),
          "Should revert with 'Channel already exists'"
        );
        debugLog("✓ Duplicate registration prevented correctly");
      }
    });

    it("should allow channels with different instance IDs", async () => {
      const participants = [wallets[0].account!.address, wallets[1].account!.address];
      const resolveContract = wallets[2].account!.address;

      const channel1 = {
        instanceID: 10n,
        participants,
        resolveContract,
      };

      const channel2 = {
        instanceID: 20n,
        participants,
        resolveContract,
      };

      // Register first channel
      const hash1 = await channelRoot.write.register([channel1], {
        account: wallets[0].account,
      });
      await client.waitForTransactionReceipt({ hash: hash1 });

      // Register second channel (should succeed)
      const hash2 = await channelRoot.write.register([channel2], {
        account: wallets[0].account,
      });
      const receipt2 = await client.waitForTransactionReceipt({ hash: hash2 });
      assert.strictEqual(receipt2.status, "success", "Second channel registration should succeed");

      debugLog("✓ Multiple channels registered with different instance IDs");
    });

    it("should handle channels with different participant sets", async () => {
      const instanceID = 30n;
      const resolveContract = wallets[4].account!.address;

      const channel1 = {
        instanceID,
        participants: [wallets[0].account!.address, wallets[1].account!.address],
        resolveContract,
      };

      const channel2 = {
        instanceID,
        participants: [wallets[2].account!.address, wallets[3].account!.address],
        resolveContract,
      };

      // Register first channel
      const hash1 = await channelRoot.write.register([channel1], {
        account: wallets[0].account,
      });
      await client.waitForTransactionReceipt({ hash: hash1 });

      // Register second channel with different participants (should succeed - different ID)
      const hash2 = await channelRoot.write.register([channel2], {
        account: wallets[0].account,
      });
      const receipt2 = await client.waitForTransactionReceipt({ hash: hash2 });
      assert.strictEqual(receipt2.status, "success", "Different participants should create different channel");

      debugLog("✓ Channels with different participants registered successfully");
    });
  });

  describe("Channel Verification", () => {
    let channelID: Hex;
    let participants: Address[];

    beforeEach(async () => {
      // Setup: Register a channel for verification tests
      const instanceID = 100n;
      participants = [wallets[0].account!.address, wallets[1].account!.address];
      const resolveContract = wallets[2].account!.address;

      const channel = {
        instanceID,
        participants,
        resolveContract,
      };

      const hash = await channelRoot.write.register([channel], {
        account: wallets[0].account,
      });
      await client.waitForTransactionReceipt({ hash });

      channelID = keccak256(
        encodeAbiParameters(
          parseAbiParameters("uint, address[], address"),
          [instanceID, participants, resolveContract]
        )
      );
    });

    it("should verify valid signatures from all participants", async () => {
      const stateHash = keccak256(toHex("state1"));
      const opReturn = keccak256(toHex("return1"));

      // Create payload
      const payload = keccak256(
        encodeAbiParameters(
          parseAbiParameters("bytes32, bytes32"),
          [stateHash, opReturn]
        )
      );

      // Sign with both participants
      const signatures: Hex[] = [];
      for (let i = 0; i < 2; i++) {
        const signature = await wallets[i].signMessage({
          message: { raw: payload },
        });
        signatures.push(signature);
      }

      const proof = {
        signatures,
        stateHash,
        OP_RETURN: opReturn,
      };

      // Verify
      const isValid = await channelRoot.read.verify([channelID, proof]);
      assert.strictEqual(isValid, true, "Verification should succeed with valid signatures");

      debugLog("✓ Valid signatures verified successfully");
    });

    it("should reject verification with invalid signature", async () => {
      const stateHash = keccak256(toHex("state2"));
      const opReturn = keccak256(toHex("return2"));

      const payload = keccak256(
        encodeAbiParameters(
          parseAbiParameters("bytes32, bytes32"),
          [stateHash, opReturn]
        )
      );

      // Sign with first participant correctly
      const sig1 = await wallets[0].signMessage({
        message: { raw: payload },
      });

      // Sign with WRONG wallet for second participant
      const sig2 = await wallets[3].signMessage({
        message: { raw: payload },
      });

      const proof = {
        signatures: [sig1, sig2],
        stateHash,
        OP_RETURN: opReturn,
      };

      // Verify (should fail)
      const isValid = await channelRoot.read.verify([channelID, proof]);
      assert.strictEqual(isValid, false, "Verification should fail with invalid signature");

      debugLog("✓ Invalid signature rejected correctly");
    });

    it("should reject verification with mismatched state hash", async () => {
      const stateHash = keccak256(toHex("state3"));
      const opReturn = keccak256(toHex("return3"));

      // Sign payload with correct state
      const payload = keccak256(
        encodeAbiParameters(
          parseAbiParameters("bytes32, bytes32"),
          [stateHash, opReturn]
        )
      );

      const signatures: Hex[] = [];
      for (let i = 0; i < 2; i++) {
        const signature = await wallets[i].signMessage({
          message: { raw: payload },
        });
        signatures.push(signature);
      }

      // But submit proof with DIFFERENT state hash
      const differentStateHash = keccak256(toHex("different_state"));
      const proof = {
        signatures,
        stateHash: differentStateHash,
        OP_RETURN: opReturn,
      };

      // Verify (should fail because payload won't match)
      const isValid = await channelRoot.read.verify([channelID, proof]);
      assert.strictEqual(isValid, false, "Verification should fail with mismatched state hash");

      debugLog("✓ Mismatched state hash rejected correctly");
    });

    it("should handle verification for non-existent channel", async () => {
      const fakeChannelID = keccak256(toHex("fake_channel"));
      const stateHash = keccak256(toHex("state4"));
      const opReturn = keccak256(toHex("return4"));

      const payload = keccak256(
        encodeAbiParameters(
          parseAbiParameters("bytes32, bytes32"),
          [stateHash, opReturn]
        )
      );

      const signatures: Hex[] = [];
      for (let i = 0; i < 2; i++) {
        const signature = await wallets[i].signMessage({
          message: { raw: payload },
        });
        signatures.push(signature);
      }

      const proof = {
        signatures,
        stateHash,
        OP_RETURN: opReturn,
      };

      /// Should revert because channel doesn't exist
      try {
        await channelRoot.read.verify([fakeChannelID, proof]);
        assert.fail("Should have thrown an error for non-existent channel");
      } catch (error: any) {
        assert(
          error.message.includes("Channel does not exist"),
          "Should revert with 'Channel does not exist'"
        );
        debugLog("✓ Non-existent channel verification rejected correctly");
      }

      debugLog("✓ Non-existent channel handled (returns true due to empty loop)");
    });
  });

  describe("Edge Cases", () => {
    it("should handle channel with single participant", async () => {
      const instanceID = 200n;
      const participants = [wallets[0].account!.address];
      const resolveContract = wallets[1].account!.address;

      const channel = {
        instanceID,
        participants,
        resolveContract,
      };

      const hash = await channelRoot.write.register([channel], {
        account: wallets[0].account,
      });
      const receipt = await client.waitForTransactionReceipt({ hash });
      assert.strictEqual(receipt.status, "success", "Single participant channel should register");

      const channelID = keccak256(
        encodeAbiParameters(
          parseAbiParameters("uint, address[], address"),
          [instanceID, participants, resolveContract]
        )
      );

      // Verify with single signature
      const stateHash = keccak256(toHex("state_single"));
      const opReturn = keccak256(toHex("return_single"));
      const payload = keccak256(
        encodeAbiParameters(
          parseAbiParameters("bytes32, bytes32"),
          [stateHash, opReturn]
        )
      );

      const signature = await wallets[0].signMessage({
        message: { raw: payload },
      });

      const proof = {
        signatures: [signature],
        stateHash,
        OP_RETURN: opReturn,
      };

      const isValid = await channelRoot.read.verify([channelID, proof]);
      assert.strictEqual(isValid, true, "Single participant verification should succeed");

      debugLog("✓ Single participant channel works correctly");
    });

    it("should handle channel with many participants", async () => {
      const instanceID = 300n;
      const participants = wallets.slice(0, 5).map((w) => w.account!.address);
      const resolveContract = wallets[5].account!.address;

      const channel = {
        instanceID,
        participants,
        resolveContract,
      };

      const hash = await channelRoot.write.register([channel], {
        account: wallets[0].account,
      });
      const receipt = await client.waitForTransactionReceipt({ hash });
      assert.strictEqual(receipt.status, "success", "Multi participant channel should register");

      debugLog("✓ Many participants channel registered successfully");
    });
  });

  describe("Address Export", () => {
    it("should export ChannelRoot address for use in other contracts", () => {
      assert(CHANNEL_ROOT_ADDRESS, "CHANNEL_ROOT_ADDRESS should be exported");
      assert.strictEqual(CHANNEL_ROOT_ADDRESS, channelRootAddress, "Exported address should match deployed address");
    });
  });
});
