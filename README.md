# Chorpiler
> 2.0 Pre-Release WIP Version

[![Node.js CI](https://github.com/fstiehle/chorpiler/actions/workflows/node.js.yml/badge.svg)](https://github.com/fstiehle/chorpiler/actions/workflows/node.js.yml)
- A compiler to transform BPMN 2.0 models to efficient smart contract components, based on petri-net reductions.
- Current targets supported: Solidity Smart Contracts, [Algorand TEAL Contracts](https://github.com/fstiehle/chorpiler-algorandvm)(v1)

## Overview

Chorpiler is a tool to transform a BPMN choreography model into a Solidity smart contract that encodes the process. The contract will enforce the order of task execution, the authorisation (correct participant exeucting the task) based on bound blockchain-addresses, and data-based (XOR) decisions.
Chorpiler has additional tools that help with testing and interacting with such contracts. Chorpiler supports the following choreography elements.

| Element            | Supported  |
|--------------------|------------|
| Choreography tasks | ✔          |
| Events             | Start, End |
| Gateways           | XOR, EVENT, AND |
| Sub-Choreographies           | ✔ |
| Looping behaviour  | ✔          |
| Uncontrolled flow merge  | ✔          |

## Usage

Install and use through [npm](https://www.npmjs.com/package/chorpiler).

```
npm install chorpiler
```

See below example.

Complete example usage to parse and generate. 
```js
import * as fs from 'fs';
import chorpiler, { TriggerEncoding } from 'chorpiler';

const parser = new chorpiler.Parser();

const bpmnXML = fs.readFileSync(path.join(BPMN_PATH, 'xor.bpmn'));   
// parse BPMN file into petri net
const iNet = await parser.fromXML(bpmnXML);

const contractGenerator = new chorpiler
.generators.sol.DefaultContractGenerator(iNet[0]);

// compile to smart contract
return contractGenerator.compile().then((gen) => {
  fs.writeFileSync(
    "Process.sol", 
    gen.target, 
    { flag: 'w+' }
  );
  console.log("Process.sol generated.");
  // log encoding of participants and tasks, 
  // can also be written to a .json file
  console.log(TriggerEncoding.toJSON(gen.encoding));
})
.catch(err => console.error(err));
```

For usage see also the tests defined in `tests/compiler`. For usage of the resulting smart contracts also see `tests/output`.

### Case Variables & Data-Based Decisions

> TODO:
XOR Picture example plus corresponding XML code.

### Interacting with Contracts

> TODO: describe encodings and 
isEnabled(), give VIM example

### Advanced: Tools to Help Testing Your Contracts
> TODO:
Simulator howto
 
### Petri net generation

Our approach is based on the optimised translation technique presented in Garćıa-Bañuelos et al. [1]: a process model is converted into a Petri net, and
this net is reduced according to well-established equivalence rules. In the smart contract, the process state is then encoded as a bit array. Our approach is based on interaction Petri nets, which are a special kind of labelled Petri nets. Interaction Petri nets have been proposed as the formal basis for BPMN choreographies [2]. As labels, they store the initiator and respondent information, which are essential for the channel construction. After conversion, we apply the same reduction rules as in [1]. 

In contrast to [1], we must restrict enforcement to certain roles: only initiators are allowed to enforce tasks. Thus, in our approach, we can differentiate between manual and autonomous transitions. Manual transitions correspond to tasks that are initiated by a participant; these must be explicitly executed. Autonomous transitions are the remaining silent transitions. Converting a process model into a Petri net creates silent transitions. While most of them can be deleted through reduction, some can not be removed without creating infinite-loops [1]. These transitions must then be performed by the blockchain autonomously, given that the correct conditions are met. Consequently, these transitions are not bound to a role. The differentiation allows an efficient execution: if the conditions for a manual task are met, it is fired and terminated; further autonomous transitions may be fired, without requiring further manual transitions.

[1]: Garćıa-Bañuelos, L., Ponomarev, A., Dumas, M., Weber, I.: Optimized Execution
of Business Processes on Blockchain. In: BPM. Springer, Cham (2017) 130–146

[2]: Decker, G., Weske, M.: Local enforceability in interaction Petri nets. In: BPM.
Volume 4714 of LNCS., Springer, Cham (2007) 305–319
