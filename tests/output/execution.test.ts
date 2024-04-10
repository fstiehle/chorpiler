/**
 * Test Correctness of process execution by replaying logs
 */
import { expect, use } from "chai";
import chaiAsPromised from 'chai-as-promised';
import { readFileSync } from 'fs';
import path from "path";
import { BPMN_PATH } from "../config";
import { XESFastXMLParser } from "../../src/util/ParseXES";
import { EventLog } from "../../src/util/EventLog";
import { Wallet, Contract, ContractFactory } from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
import { ProcessEncoding } from "../../src/Generator/ProcessEncoding";

import AIM_ProcessSmartContract from './../data/generated/artifcats/IM_ProcessEnactment.json';
import ASC_ProcessSmartContract from './../data/generated/artifcats/SC_ProcessEnactment.json';
import { IM_ProcessEnactment } from './../data/generated/artifcats/types/IM_ProcessEnactment';
import { SC_ProcessEnactment } from './../data/generated/artifcats/types/SC_ProcessEnactment';

import encodingSC from './../data/generated/supply-chain/SC_ProcessExecution_encoding.json';
import assert from "assert";
use(solidity);

const parser = new XESFastXMLParser();

describe('Test Execution of Cases', () => {

  describe('Supply Chain Case', async () => {
    const eventLog = await parser.fromXML(
      readFileSync(path.join(BPMN_PATH, 'cases', 'supply-chain', 'supply-chain.xes')));

    const processEncoding = ProcessEncoding.fromJSON(encodingSC);
    const factory = new ContractFactory(ASC_ProcessSmartContract.abi, ASC_ProcessSmartContract.bytecode);
    
    describe(`Replay Conforming Traces`, () => {

      // Requires a foreach to work: https://github.com/mochajs/mocha/issues/3074
      eventLog.traces.forEach((trace, i) => {

        it(`Replay Conforming Trace ${i}`, async () => {
          const r = await deploy(factory, processEncoding);
          const contracts = r.contracts as Map<string, SC_ProcessEnactment>;
          let totalGasCost = r.tx.gasUsed.toNumber();
          console.log('Gas', 'Deployment', ':', totalGasCost);
          const contract = [...contracts.values()][0];

          for (const event of trace) {
            const participant = contracts.get(event.source);
            const taskID = processEncoding.tasks.get(event.name);
            assert(participant !== undefined && taskID !== undefined,
              `source '${event.source}' event '${event.name}' not found`);

            const preTokenState = await contract.tokenState();
            const tx = await (await participant.enact(taskID)).wait(1);
            // Expect that tokenState has changed!
            expect(await contract.tokenState()).to.not.equal(preTokenState);
            // console.debug('Gas', 'Enact Task', event.name, ":", tx.gasUsed.toNumber());
            totalGasCost += tx.gasUsed.toNumber();
          }
          expect(
            await contract.tokenState(), 
            "End of process not reached!"
          ).to.equal(0);
          console.log('Gas', 'Total', ':', totalGasCost);
        })
      })
    })

    describe(`Replay Non-Conforming Traces`, () => {

      const badLog = EventLog.genNonConformingLog(eventLog, processEncoding, 2);
      
      // Requires a foreach to work: https://github.com/mochajs/mocha/issues/3074
      badLog.traces.forEach((trace, i) => {

        it(`Replay Non-Conforming Trace ${i}`, async () => {
          const r = await deploy(factory, processEncoding);
          const contracts = r.contracts as Map<string, SC_ProcessEnactment>;
          const contract = [...contracts.values()][0];

          let eventsRejected = 0;
          for (const event of trace) {

            const participant = contracts.get(event.source);
            const taskID = processEncoding.tasks.get(event.name);
            assert(participant !== undefined && taskID !== undefined,
              `source '${event.source}' event '${event.name}' not found`);
            
            const preTokenState = await contract.tokenState();
            await (await participant.enact(taskID)).wait(1);

            if ((await contract.tokenState()).eq(preTokenState)) eventsRejected++;
          }
          
          // Expect that tokenState has at least NOT changed once (one non-conforming event)
          // or end event has not been reached (if only an event was removed, but no non-conforming was added)
          expect(eventsRejected > 0 || !(await contract.tokenState()).eq(0));
        })
      })
    })

  })
})

const deploy = async (factory: ContractFactory, processEncoding: ProcessEncoding) => {
  const wallets = new MockProvider()
    .getWallets()
    .slice(0, processEncoding.participants.size);

  const contract = await factory
    .connect(wallets[0])
    .deploy([...[...wallets.values()].map(v => v.address)])
  
  const tx = await contract.deployTransaction.wait(1)

  const contracts = new Map<string, Contract>();
  for (const [id, num] of processEncoding.participants) {
    contracts.set(id, contract.connect(wallets[num]));
  }
  return {contracts, tx};
}