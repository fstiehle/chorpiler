/**
 * Test Correctness of process execution by replaying logs
 */
import { expect, use } from "chai";
import chaiAsPromised from 'chai-as-promised';
import util from 'util';
import fs from 'fs';
import path from "path";
import { BPMN_PATH } from "../config";
import { XESFastXMLParser } from "../../src/util/ParseXES";
import { EventLog, Trace } from "../../src/util/EventLog";
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
import { ProcessEncoding } from "../../src/Generator/ProcessEncoding";

import AIM_ProcessSmartContract from './../data/generated/artifcats/IM_ProcessEnactment.json';
import ASC_ProcessSmartContract from './../data/generated/artifcats/SC_ProcessEnactment.json';
import { IM_ProcessEnactment } from './../data/generated/artifcats/types/IM_ProcessEnactment';
import { SC_ProcessEnactment } from './../data/generated/artifcats/types/SC_ProcessEnactment';

import encodingSC from './../data/generated/supply-chain/SC_ProcessExecution_encoding.json';
import assert from "assert";

const readFile = util.promisify(fs.readFile);
use(chaiAsPromised);
use(solidity);

const parser = new XESFastXMLParser();

describe('Test Execution of Cases', () => {

  describe('Supply Chain Case', () => {
    let eventLog: EventLog;
    const processEncoding = ProcessEncoding.fromJSON(encodingSC);
    const participants = new Map<String, SC_ProcessEnactment>;
    let contract: SC_ProcessEnactment;
    let totalGas = 0;

    before(async () => {
      const data = await readFile(path.join(BPMN_PATH, 'cases', 'supply-chain', 'supply-chain.xes'));
      eventLog = await parser.fromXML(data);
    })

    beforeEach(async () => {
      const wallets = new MockProvider().getWallets().slice(0, processEncoding.participants.size);

      contract = (await deployContract(
        wallets[0], 
        ASC_ProcessSmartContract, 
        [[...[...wallets.values()].map(v => v.address)]])
        ) as SC_ProcessEnactment;

        let tx = await contract.deployTransaction.wait(1);
        let cost = tx.gasUsed.toNumber();
        console.log('Gas', 'Deployment:', cost);
        totalGas += cost;

        for (const [id, num] of processEncoding.participants) {
          participants.set(id, contract.connect(wallets[num]));
        }
    });

    it('Replay Conforming Traces', async () => {
      for (const trace of eventLog.traces) {
        await replayTrace(trace, participants, processEncoding);
        expect(
          contract.tokenState(), 
          "End of process not reached!"
        ).to.eventually.equal(0);
      }
    })

    it('Replay Non-Conforming Traces', () => {
      //console.log(EventLog.genNonConformingLog(eventLog, processEncoding, 60));
    })
  })
})

const replayTrace = async (trace: Trace, 
  contracts: Map<String, SC_ProcessEnactment>, 
  processEncoding: ProcessEncoding) => {
  for (const event of trace) {
    const contract = contracts.get(event.source);
    const taskID = processEncoding.tasks.get(event.name);
    assert(contract !== undefined && taskID !== undefined,
      `model log mismatch with source '${event.source}' event '${event.name}'`);

    await contract.enact(taskID);
  }
}