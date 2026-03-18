import * as fs from "fs";
import path from "path";
import util from "util";
import { CaseVariable } from "../../src/Generator/Encoding/Encoding.js";
import SolDefaultContractGenerator from "../../src/Generator/target/Sol/DefaultGenerator.js";
import SolStateChannelContractGenerator from "../../src/Generator/target/Sol/StateChannelGenerator.js";
import { BPMN_PATH, CONTRACTS_PATH } from "../config.js";
import { TemplateEngine } from "../../src/Generator/TemplateEngine.js";
import { TriggerEncoding } from "../../src/Generator/Encoding/JSON/TriggerEncoding.js";
import assert from "assert";
import { INetParser } from "../../src/index.js";

export interface AddressEntry {
  callID: string;
  address: string | undefined;
}

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

export const parseBpmn = async (
  parser: INetParser,
  name: string,
  caseVariables?: CaseVariable[],
  addressList?: AddressEntry[],
  isStateChannel: boolean = false,
) => {
  const data = await readFile(path.join(BPMN_PATH, `${name}.bpmn`));
  const iNets = await parser.fromXML(data);

  const generators = [];
  for (const iNet of iNets) {
    const generator = parseINet(
      iNet,
      caseVariables,
      addressList,
      isStateChannel,
    );
    generators.push(generator);
  }

  return generators;
};

export const parseINet = (
  iNet: any,
  caseVariables?: CaseVariable[],
  addressList?: AddressEntry[],
  isStateChannel: boolean = false,
) => {
  let generator;
  if (isStateChannel) {
    generator = new SolStateChannelContractGenerator(iNet);
  } else {
    generator = new SolDefaultContractGenerator(iNet, iNet.isCalled);
  }

  // Add case variables if provided
  if (caseVariables) {
    caseVariables.forEach((variable) => generator.addCaseVariable(variable));
  }

  if (iNet.callList.size > 0) {
    // Already deploy called contracts

    // Add call addresses if provided
    if (addressList) {
      addressList.forEach((entry) => {
        try {
          generator.addCallAddress(
            entry.callID,
            entry.address ?? "0x0000000000000000000000000000000000000000",
          );
        } catch (error) {
          if (
            !(error instanceof Error) ||
            !error.message.includes("does not exist in the InteractionNet")
          )
            throw error;
        }
      });
    }
  }

  return generator;
};

export const compileBpmn = async (
  parser: INetParser,
  name: string,
  caseVariables?: CaseVariable[],
  addressList?: AddressEntry[],
  unfold: boolean = true,
  isStateChannel: boolean = false,
) => {
  const generators = await parseBpmn(
    parser,
    name,
    caseVariables,
    addressList,
    isStateChannel,
  );

  const results = [];
  for (const generator of generators) {
    const result = await compileCase(generator, unfold, isStateChannel);
    results.push(result);
  }

  return results;
};

export const compileINet = async (
  generator: TemplateEngine,
  unfold: boolean = true,
  isStateChannel: boolean = false,
) => {
  return await compileCase(generator, unfold, isStateChannel);
};

const compileCase = async (
  generator: TemplateEngine,
  unfold: boolean = true,
  isStateChannel: boolean = false,
) => {
  const output = await generator.compile({
    unfoldSubNets: unfold,
    events: true,
    debug: true,
  });

  let directory = CONTRACTS_PATH;
  // if (
  //   (output.encoding.calls && output.encoding.calls.size > 0) ||
  //   output.encoding.isCalled
  // ) {
  //   directory = path.join(directory, "callchoreos");
  // }

  const solFilePath = path.join(directory, `${generator.iNet.id}.sol`);
  const jsonFilePath = path.join(directory, `${generator.iNet.id}.json`);

  // Write the contract file
  await writeFile(solFilePath, output.target, { flag: "w+" });

  // Write the encoding file
  await writeFile(
    jsonFilePath,
    JSON.stringify(TriggerEncoding.toJSON(output.encoding)),
    { flag: "w+" },
  );

  // Verify the files were created
  assert.ok(
    fs.existsSync(solFilePath),
    `${generator.iNet.id} contract file should be created`,
  );
  assert.ok(
    fs.existsSync(jsonFilePath),
    `${generator.iNet.id} encoding file should be created`,
  );

  return output;
};
