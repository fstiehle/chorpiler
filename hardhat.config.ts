import { HardhatUserConfig } from "hardhat/config";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatViemAssertions from "@nomicfoundation/hardhat-viem-assertions";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import { CONTRACTS_PATH, OUTPUT_PATH } from "./tests/config.js";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  paths: {
    sources: CONTRACTS_PATH,
    cache: OUTPUT_PATH + "/cache",
    artifacts: OUTPUT_PATH + "/artifacts",
  },
  plugins: [
    hardhatViem,
    hardhatViemAssertions,
    hardhatNodeTestRunner,
    hardhatNetworkHelpers,
  ],
};

export default config;
