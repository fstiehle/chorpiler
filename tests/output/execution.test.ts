/**
 * Test Correctness of process execution by replaying logs
 */
import { expect, use } from "chai";
import { readFileSync } from 'fs';
import path from "path";
import { BPMN_PATH } from "../config";
import { EventLog } from "../../src/util/EventLog";
import { Contract, ContractFactory } from 'ethers';
import { MockProvider, solidity} from 'ethereum-waffle';
import { XESFastXMLParser } from "../../src/util/XESFastXMLParser";

import AIM_ProcessSmartContract from './../data/generated/artifcats/IM_ProcessExecution.json';
import ASC_ProcessSmartContract from './../data/generated/artifcats/SC_ProcessExecution.json';
import APH_ProcessSmartContract from './../data/generated/artifcats/PH_ProcessExecution.json';
import APIZZA_ProcessSmartContract from './../data/generated/artifcats/PIZZA_ProcessExecution.json';
import ARA_ProcessSmartContract from './../data/generated/artifcats/RA_ProcessExecution.json';

import encodingSC from './../data/generated/supply-chain/SC_ProcessExecution_encoding.json';
import encodingIM from './../data/generated/incident-management/IM_ProcessExecution_encoding.json';
import encodingPH from './../data/generated/out-of-order/PH_ProcessExecution_encoding.json';
import encodingPIZZA from './../data/generated/pizza/PIZZA_ProcessExecution_encoding.json';
import encodingRA from './../data/generated/rental-agreement/RA_ProcessExecution_encoding.json';
import assert from "assert";
import { TriggerEncoding } from "../../src";

use(solidity);

const NR_NON_CONFORMING_TRACES = 0;
const parser = new XESFastXMLParser();

(async () => {
  // load event logs async here
  const eventLogSC = await parser.fromXML(
    readFileSync(path.join(BPMN_PATH, 'cases', 'supply-chain', 'supply-chain.xes')));

  const eventLogIM = await parser.fromXML(
    readFileSync(path.join(BPMN_PATH, 'cases', 'incident-management', 'incident-management.xes')));

  const eventLogPH = await parser.fromXML(
    readFileSync(path.join(BPMN_PATH, 'cases', 'out-of-order', 'out-of-order-xml.xes')));

  const eventLogPIZZA = await parser.fromXML(
    readFileSync(path.join(BPMN_PATH, 'cases', 'pizza', 'pizza.xes')));

  const eventLogRA = await parser.fromXML(
    readFileSync(path.join(BPMN_PATH, 'cases', 'rental-agreement', 'rental-agreement.xes')));

  describe('Test Execution of Cases', () => {

    describe('Supply Chain Case', () => {

      testCase(
        eventLogSC, 
        TriggerEncoding.fromJSON(encodingSC),
        new ContractFactory(ASC_ProcessSmartContract.abi, ASC_ProcessSmartContract.bytecode)
      );
    });

    describe('Incident Management Case', () => {

      testCase(
        eventLogIM, 
        TriggerEncoding.fromJSON(encodingIM),
        new ContractFactory(AIM_ProcessSmartContract.abi, AIM_ProcessSmartContract.bytecode)
      );
    });

    describe('Out of Order Case', () => {

      testCase(
        eventLogPH, 
        TriggerEncoding.fromJSON(encodingPH),
        new ContractFactory(APH_ProcessSmartContract.abi, APH_ProcessSmartContract.bytecode)
      );
    });

    describe('Pizza Case', () => {

      testCase(
        eventLogPIZZA, 
        TriggerEncoding.fromJSON(encodingPIZZA),
        new ContractFactory(APIZZA_ProcessSmartContract.abi, APIZZA_ProcessSmartContract.bytecode)
      );
    });

    describe('Rental Agreement Case', () => {

      testCase(
        eventLogRA, 
        TriggerEncoding.fromJSON(encodingRA),
        new ContractFactory(ARA_ProcessSmartContract.abi, ARA_ProcessSmartContract.bytecode)
      );
    });
  });

})();

// Once we handle conditions differently (with a common interface) we should pass a generic here
// type ProcessEnactment = SC_ProcessEnactment | IM_ProcessEnactment;
const testCase = (
  eventLog: EventLog, 
  TriggerEncoding: TriggerEncoding, 
  factory: ContractFactory) => {

  describe(`Replay Traces`, () => {

    // Requires a foreach to work: https://github.com/mochajs/mocha/issues/3074
    eventLog.traces.forEach((trace, i) => {

      it(`Replay Conforming Trace ${i}`, async () => {
        const r = await deploy(factory, TriggerEncoding);
        const contracts = r.contracts;
        let totalGasCost = r.tx.gasUsed.toNumber();

        console.log('Gas', 'Deployment', ':', totalGasCost);
        const contract = [...contracts.values()][0];

        for (const event of trace) {
          // Implement data change, allow data change also if event name not found
          const participant = contracts.get(event.source);
          const taskID = TriggerEncoding.tasks.get(event.name);
          assert(participant !== undefined, `source (participant) '${event.source}' for event '${event.name}' not found`);
          //console.debug(`source '${event.source}' event '${event.name}'`)

          if (taskID !== undefined) {
            const preTokenState = await contract.tokenState();
            console.debug('Try to Enact Task:', event.name, 'ID:', taskID);
            const tx = await (await participant.enact(taskID)).wait(1);

            // Expect that tokenState has changed!
            expect(await contract.tokenState()).to.not.equal(preTokenState);
            console.debug('Gas', 'Enact Task', event.name, ":", tx.gasUsed.toNumber());
            totalGasCost += tx.gasUsed.toNumber();
          }

          // data changes
          if (event.dataChange) {
            for (const el of event.dataChange) {
              const tx = await (await contract["set" + el.variable](el.val)).wait(1);
              console.debug('Gas', 'Write', event.name, el.variable, el.val, ":", tx.gasUsed.toNumber());
              totalGasCost += tx.gasUsed.toNumber();
            }
          }
        }
        expect(
          await contract.tokenState(),
          "End of process not reached!"
        ).to.equal(0);
        console.log('Gas', 'Total', ':', totalGasCost);
      });
    });

    const badLog = EventLog.genNonConformingLog(eventLog, TriggerEncoding, NR_NON_CONFORMING_TRACES);

    // Requires a foreach to work: https://github.com/mochajs/mocha/issues/3074
    badLog.traces.forEach((trace, i) => {

      it(`Replay Non-Conforming Trace ${i}`, async () => {
        const r = await deploy(factory, TriggerEncoding);
        const contracts = r.contracts;
        const contract = [...contracts.values()][0];

        let eventsRejected = 0;
        for (const event of trace) {

          const participant = contracts.get(event.source);
          const taskID = TriggerEncoding.tasks.get(event.name);
          assert(participant !== undefined && taskID !== undefined,
            `source '${event.source}' event '${event.name}' not found`);
          console.log(participant !== undefined && taskID !== undefined,
              `source '${event.source}' event '${event.name}' not found`);

          const preTokenState = await contract.tokenState();
          const tx = await (await participant.enact(taskID)).wait(1);

          if ((await contract.tokenState()).eq(preTokenState)) eventsRejected++;
        }

        // Expect that tokenState has at least NOT changed once (one non-conforming event)
        // or end event has not been reached (if only an event was removed, but no non-conforming was added)
        assert(eventsRejected > 0 || !(await contract.tokenState()).eq(0));
      });
    });
  });

  it.skip("should reject tx from wrong participant", async () => {
    const r = await deploy(factory, TriggerEncoding);
    const contracts = r.contracts;
    const contract = [...contracts.values()][0];
    const firstEvent = eventLog.traces.at(0)!.events.at(0)!;
    const taskID = TriggerEncoding.tasks.get(firstEvent.name);
    let wrongParticipant = "";
    TriggerEncoding.participants.forEach((_, id) => {
      if (id !== firstEvent.source) return wrongParticipant = id;
    })

    const preTokenState = await contract.tokenState();
    await (await contracts.get(wrongParticipant)!.enact(taskID)).wait(1);

    expect(await contract.tokenState()).to.equal(preTokenState);
  })
}

const deploy = async (factory: ContractFactory, TriggerEncoding: TriggerEncoding) => {
  const wallets = new MockProvider()
    .getWallets()
    .slice(0, TriggerEncoding.participants.size);

  const contract = await factory
    .connect(wallets[0])
    .deploy([...[...wallets.values()].map(v => v.address)])

  const tx = await contract.deployTransaction.wait(1)

  const contracts = new Map<string, Contract>();
  for (const [id, num] of TriggerEncoding.participants) {
    contracts.set(id, contract.connect(wallets[num]));
  }
  return {contracts, tx};
}