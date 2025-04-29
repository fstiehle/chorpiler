import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const OUTPUT_PATH = "./tests/output"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      "optimizer": { 
        "enabled": true,
        "runs": 100
      }
    }
  },
  paths: {
    sources: OUTPUT_PATH + "/contracts",
    tests: OUTPUT_PATH,
    cache: OUTPUT_PATH + "/cache",
    artifacts: OUTPUT_PATH + "/artifacts"
  },
  mocha: {
    timeout: 40000
  },
  typechain: {
    outDir: OUTPUT_PATH + '/types',
  },
};

export default config;