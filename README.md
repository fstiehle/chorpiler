# Chorpiler
[![Node.js CI](https://github.com/fstiehle/chorpiler/actions/workflows/node.js.yml/badge.svg)](https://github.com/fstiehle/chorpiler/actions/workflows/node.js.yml)
- A compiler to transform BPMN 2.0 choreographies to efficient smart contract components, based on petri-net reductions.
- Current targets supported: Solidity Smart Contracts, [Algorand TEAL Contracts](https://github.com/fstiehle/chorpiler-algorandvm)

## Overview

| Element            | Supported  |
|--------------------|------------|
| Choreography tasks | ✔          |
| Events             | Start, End |
| Gateways           | XOR, EVENT, AND |
| Looping behaviour  | ✔          |
| Uncontrolled flow merge  | ✔          |

## Usage

Install and use through [npm](https://www.npmjs.com/package/chorpiler).

```
npm install chorpiler
```

Chorpiler offers two types of output that implement the process model: 
(i) a smart contract that can be used directly to execute the process, and performs conformance checks on each task.
(ii) a state channel smart contract (see an example usage of channels in [fstiehle/leafhopper](https://www.github.com/fstiehle/leafhopper)).

See below example.

Complete example usage to parse and generate. 
```js
import * as fs from 'fs';
import chorpiler, { ProcessEncoding } from 'chorpiler';

const parser = new chorpiler.Parser();

const bpmnXML = fs.readFileSync("yourBPMNXML.bpmn");   
// parse BPMN file into petri net
const iNet = await parser.fromXML(bpmnXML);

const contractGenerator = new chorpiler
  .generators.sol.DefaultContractGenerator(iNet);

// compile to smart contract
contractGenerator.compile().then((gen) => {
  fs.writeFileSync(
    "Process.sol", 
    gen.target, 
    { flag: 'w+' }
  );
  console.log("Process.sol generated.");
  // log encoding of participants and tasks, 
  // can also be written to a .json file
  console.log(ProcessEncoding.toJSON(gen.encoding));
})
.catch(err => console.error(err));
```

For usage see also the tests defined in `tests/compiler`. For usage of the resulting smart contracts also see `tests/output`.

## Run & Tests

If you have node installed, a simple `npm install` is enough. To confirm, you can execute tests using `npm run test`. 

Two groups of tests exist:
- **Testing the parser and compiler**: By running `npm run test/compiler`, tests are executed confirming that the parser and compiler produce outputs from a range of correct and supported process models without reporting errors and rejects malformed and unsupported BPMN elements with reporting errors. These tests are found in `tests/compiler`.
- **Testing the generated output:** By running `npm run test/output`, tests are executed confirming that the produced outputs are valid artefacts, by replaying conforming logs (which must lead to a valid execution) and non-conforming logs (which must be rejected). Gas cost are also reported for the conforming logs. These tests are found in `tests/output`.

`npm run test` runs both test groups.

## Architecture
> [!NOTE]
> More on this soon.

## Theory

### Petri net generation

Our approach is based on the optimised translation technique presented in Garćıa-Bañuelos et al. [1]: a process model is converted into a Petri net, and
this net is reduced according to well-established equivalence rules. In the smart contract, the process state is then encoded as a bit array. Our approach is based on interaction Petri nets, which are a special kind of labelled Petri nets. Interaction Petri nets have been proposed as the formal basis for BPMN choreographies [2]. As labels, they store the initiator and respondent information, which are essential for the channel construction. After conversion, we apply the same reduction rules as in [1]. 

In contrast to [1], we must restrict enforcement to certain roles: only initiators are allowed to enforce tasks.3 Thus, in our approach, we can differentiate between manual and autonomous transitions. Manual transitions correspond to tasks that are initiated by a participant; these must be explicitly executed. Autonomous transitions are the remaining silent transitions. Converting a process model into a Petri net creates silent transitions. While most of them can be deleted through reduction, some can not be removed without creating infinite-loops [1]. These transitions must then be performed by the blockchain autonomously, given that the correct conditions are met. Consequently, these transitions are not bound to a role. The differentiation allows a more efficient execution: if the conditions for a manual task are met, it is fired and terminated; further autonomous transitions may be fired, without requiring further manual transitions.

![Petri net generation](https://github.com/fstiehle/chorpiler/blob/main/docs/figs/transformation.svg)

[1]: Garćıa-Bañuelos, L., Ponomarev, A., Dumas, M., Weber, I.: Optimized Execution
of Business Processes on Blockchain. In: BPM. Springer, Cham (2017) 130–146

[2]: Decker, G., Weske, M.: Local enforceability in interaction Petri nets. In: BPM.
Volume 4714 of LNCS., Springer, Cham (2007) 305–319
