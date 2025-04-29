/**
 * Test Correctness of process execution by replaying logs
 */
import { expect } from "chai";
import { readFileSync } from 'fs';
import path from "path";
import { BPMN_PATH } from "../config";
import hre from "hardhat";
import assert from "assert";
import { TriggerEncoding } from "../../src";
import { XESFastXMLParser } from "../../src/util/EventLog/XESFastXMLParser";
import { EventLog } from "../../src/util/EventLog/EventLog";

import encodingSC from './../data/generated/supply-chain/SC_ProcessExecution_encoding.json';
import encodingIM from './../data/generated/incident-management/IM_ProcessExecution_encoding.json';
import encodingPH from './../data/generated/out-of-order/PH_ProcessExecution_encoding.json';
import encodingPIZZA from './../data/generated/pizza/PIZZA_ProcessExecution_encoding.json';
import encodingRA from './../data/generated/rental-agreement/RA_ProcessExecution_encoding.json';

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
        "SC"
      );
    });

    describe('Incident Management Case', () => {

      testCase(
        eventLogIM, 
        TriggerEncoding.fromJSON(encodingIM),
        "IM"
      );
    });

    describe('Out of Order Case', () => {

      testCase(
        eventLogPH, 
        TriggerEncoding.fromJSON(encodingPH),
        "PH"
      );
    });

    describe('Pizza Case', () => {

      testCase(
        eventLogPIZZA, 
        TriggerEncoding.fromJSON(encodingPIZZA),
        "PIZZA"
        );
      });

    describe.skip('Rental Agreement Case', () => {

      testCase(
        eventLogRA, 
        TriggerEncoding.fromJSON(encodingRA),
        "RA"
      );
    });
  });

})();

// Once we handle conditions differently (with a common interface) we should pass a generic here
// type ProcessEnactment = SC_ProcessEnactment | IM_ProcessEnactment;
const testCase = (
  eventLog: EventLog, 
  TriggerEncoding: TriggerEncoding, 
  name: string) => {

  describe(`Replay Traces`, () => {

    // Requires a foreach to work: https://github.com/mochajs/mocha/issues/3074
    eventLog.traces.forEach((trace, i) => {

      it(`Replay Conforming Trace ${i}`, async () => {
        const r = await deploy(name, TriggerEncoding);
        const contracts = r.contracts;
        let totalGasCost = r.tx.gasUsed;

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
            console.debug('Gas', 'Enact Task', event.name, ":", tx.gasUsed);
            totalGasCost += tx.gasUsed;
          }

          // data changes
          if (event.dataChange) {
            for (const el of event.dataChange) {
              const tx = await (await contract["set" + el.variable](el.val)).wait(1);
              console.debug('Gas', 'Write', event.name, el.variable, el.val, ":", tx.gasUsed);
              totalGasCost += tx.gasUsed;
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
        const r = await deploy(name, TriggerEncoding);
        const contracts = r.contracts;
        const contract = [...contracts.values()][0];

        let eventsRejected = 0;
        for (const event of trace) {

          const participant = contracts.get(event.source);
          const taskID = TriggerEncoding.tasks.get(event.name);
          
          assert(participant !== undefined, `source (participant) '${event.source}' for event '${event.name}' not found`);
          //console.debug(`source '${event.source}' event '${event.name}'`)

          if (taskID !== undefined) {
            const preTokenState = await contract.tokenState();
            const tx = await (await participant.enact(taskID)).wait(1);

            if (preTokenState.toString() === (await contract.tokenState()).toString()) eventsRejected++;
          }

          // data changes
          if (event.dataChange) {
            for (const el of event.dataChange) {
              const tx = await (await contract["set" + el.variable](el.val)).wait(1);
            }
          }
        }

        // Expect that tokenState has at least NOT changed once (one non-conforming event)
        // or end event has not been reached (if only an event was removed, but no non-conforming was added)
        assert(eventsRejected > 0 || !((await contract.tokenState()).toString() === "0"));
      });
    });
  });

  it.skip("should reject tx from wrong participant", async () => {
    const r = await deploy(name, TriggerEncoding);
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

const deploy = async (name: string, TriggerEncoding: TriggerEncoding) => {
  const wallets = 
  (await hre.ethers.getSigners())
    .slice(0, TriggerEncoding.participants.size);

  const contract = await hre.ethers.deployContract(
    name + "_ProcessExecution", [[...wallets.values()].map(v => v.address)], wallets[0]);

  const tx = await contract.deploymentTransaction()!.wait(1)
  if (!tx) throw Error()

  const contracts = new Map<string, any>();
  for (const [id, num] of TriggerEncoding.participants) {
    contracts.set(id, contract.connect(wallets[num]));
  }
  
  return {contracts, tx};
}