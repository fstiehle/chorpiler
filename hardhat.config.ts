import { HardhatUserConfig } from "hardhat/config";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatViemAssertions from "@nomicfoundation/hardhat-viem-assertions";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import { CONTRACTS_PATH, OUTPUT_PATH } from "./tests/config.js";

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
    sources: [ CONTRACTS_PATH, "src/Contracts" ],
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
