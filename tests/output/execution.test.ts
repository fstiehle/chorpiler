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
import { ethers } from 'ethers';
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

    const wallets = new MockProvider().getWallets();
    const participantWallets = new Map<String, ethers.Wallet>;
    let initialisingWallet: ethers.Wallet;
    let contract: SC_ProcessEnactment;
    let totalGas = 0;

    before(async () => {
      const data = await readFile(path.join(BPMN_PATH, 'cases', 'supply-chain', 'supply-chain.xes'));
      eventLog = await parser.fromXML(data);

      for (const [id, num] of processEncoding.participants) {
        participantWallets.set(id, wallets[num]);
      }

      // make the first participant the initialiser
      initialisingWallet = participantWallets.values().next().value; 
    })

    beforeEach(async () => {
      contract = (await deployContract(
        initialisingWallet, 
        ASC_ProcessSmartContract, 
        [[...[...participantWallets.values()].map(v => v.address)]])
        ) as SC_ProcessEnactment;

        let tx = await contract.deployTransaction.wait(1);
        let cost = tx.gasUsed.toNumber();
        console.log('Gas', 'Deployment:', cost);
        totalGas += cost;
    });

    it('Replay Conforming Traces', () => {

      for (const trace of eventLog.traces) {
        replayTrace(trace, participantWallets, processEncoding, contract);
        expect(
          contract.connect(initialisingWallet).tokenState(), 
          "End of process not reached!"
        ).to.eventually.equal(0);
      }
    })

    it('Replay Non-Conforming Trace', () => {
      console.log(EventLog.genNonConformingLog(eventLog, processEncoding, 60));
    })
  })

})

const replayTrace = (trace: Trace, 
  participantWallets: Map<String, ethers.Wallet>, 
  processEncoding: ProcessEncoding, 
  contract: SC_ProcessEnactment) => {
  for (const event of trace) {
    const participant = participantWallets.get(event.source);
    const taskID = processEncoding.tasks.get(event.name);
    assert(participant && taskID,
      `model log mismatch with source '${event.source}' event '${event.name}'`);

    expect(contract
      .connect(participant)
      .enact(taskID)
    ).to.eventually.be.fulfilled;
  }
}
