/**
 * Test Correctness of process execution by replaying logs
 */
import { expect, use } from "chai";
import chaiAsPromised from 'chai-as-promised';
import util from 'util';
import fs from 'fs';
import path from "path";
import { BPMN_PATH } from "../config";
import { XESFastXMLParser } from "../util/ParseXES";
import { EventLog } from "../util/EventLog";
import {Contract, ethers} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';

import AIM_ProcessSmartContract from './../data/generated/artifcats/IM_ProcessEnactment.json';
import ASC_ProcessSmartContract from './../data/generated/artifcats/SC_ProcessEnactment.json';
import { IM_ProcessEnactment } from './../data/generated/artifcats/types/IM_ProcessEnactment';
import { SC_ProcessEnactment } from './../data/generated/artifcats/types/SC_ProcessEnactment';

import encodingSC from './../data/generated/supply-chain/SC_ProcessExecution_encoding.json';

const readFile = util.promisify(fs.readFile);
use(chaiAsPromised);
use(solidity);

const parser = new XESFastXMLParser();

describe('Test Execution of Cases', () => {

  describe('Supply Chain Case', () => {

    let eventLog: EventLog;

    const provider = new MockProvider();
    const wallets = provider.getWallets();
    const participants = new Map<String, ethers.Wallet>;
    let contract: Contract;

    before(async () => {
      const data = await readFile(path.join(BPMN_PATH, 'cases', 'supply-chain', 'supply-chain.xes'));
      eventLog = await parser.fromXML(data);
      for (const event of eventLog) {
        console.log(event.name);
      }

      for (let i = 0; i < Object.keys(encodingSC.participants).length; i++) {
        participants.set(Object.keys(encodingSC.participants)[i], wallets[i]);
      }
    })

    beforeEach(async () => {

      contract = (await deployContract(
        participants.values().next().value, 
        ASC_ProcessSmartContract, 
        [[...[...participants.values()].map(v => v.address)]])
        ) as SC_ProcessEnactment;

      let total = 0;
      let tx = await contract.deployTransaction.wait(1);
      let cost = tx.gasUsed.toNumber();
      console.log('Gas', 'Deployment:', cost);
      total += cost;
    });

    it('Replay Conforming Trace', () => {
      
    })

    it('Replay Non-Conforming Trace', () => {
      
    })
  })

})
/* const parseXES = async (XESPath: string, parser: XES, gen: TemplateEngine) => {
  const data = await readFile(bpmnPath);
  return parser.fromXML(data).then((iNet) => {
    return gen.compile(iNet);
  });
} */