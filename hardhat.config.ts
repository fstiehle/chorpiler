import { HardhatUserConfig } from "hardhat/config";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatViemAssertions from "@nomicfoundation/hardhat-viem-assertions";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import { CONTRACTS_PATH, CHANNEL_CONTRACTS_PATH, OUTPUT_PATH, TEST_MODE as CONFIG_TEST_MODE } from "./tests/config.js";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    default: {
      type: "edr-simulated",
      chainId: 123,
      mining: { auto: true },
    },
  },
  paths: {
    // Determine runtime test mode: environment variable takes precedence over config value
    sources: ((): string[] => {
      const mode = process.env.TEST_MODE ?? CONFIG_TEST_MODE ?? "default";
      if (mode === "channels") {
        // When testing channels, only include the channel subfolder (ignore parent contracts folder)
        return [CHANNEL_CONTRACTS_PATH, "src/Contracts"];
      }
      return [CONTRACTS_PATH, "src/Contracts"];
    })(),
    cache: OUTPUT_PATH + "/cache",
    artifacts: OUTPUT_PATH + "/artifacts",
    tests: "tests",
  },
  plugins: [
    hardhatViem,
    hardhatViemAssertions,
    hardhatNodeTestRunner,
    hardhatNetworkHelpers,
  ],
};

export default config;
