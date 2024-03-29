
# Chorpiler
[![Node.js CI](https://github.com/fstiehle/chorpiler/actions/workflows/node.js.yml/badge.svg)](https://github.com/fstiehle/chorpiler/actions/workflows/node.js.yml)
- A compiler for BPMN choreographies to generate efficient enactment components based on petri-net reductions.
- Current targets supported: Solidity Smart Contracts, TypeScript.

## Overview

| Element            | Supported  |
|--------------------|------------|
| Choreography tasks | ✔          |
| Events             | Start, End |
| Gateways           | XOR, AND   |
| Looping behaviour  | ✔          |

## Usage

Install and use through [npm](https://www.npmjs.com/package/chorpiler).

```
npm install chorpiler
```

Chorpiler offers three types of output, Process Enactment and Process Channel. Process Channel (more info on channels soon) is only available for Solidity. For usage, see below example.
```js
import chorpiler from 'chorpiler';

const parser = new chorpiler.Parser();
const pcGenerator = new chorpiler.Generator.Sol.ProcessChannel();
const tsGenerator = new chorpiler.Generator.TS.Enactment();
const solGenerator = new chorpiler.Generator.Sol.Enactment();
```

Complete example usage to parse and generate. 
```js
import * as fs from 'fs';
import chorpiler from 'chorpiler';

fs.readFile("/yourBPMNXML.bpmn",
  async (err, data) => {
    if (err) { console.error(err); }
    const iNet = await parser.fromXML(data);

    pcGenerator.compile(iNet)
    .then((gen) => {
      console.log(gen.encoding);
      fs.writeFile("/generated/ProcessChannel.sol", gen.target, { flag: 'w+' },
      (err) => { if (err) { console.error(err); } });
      console.log("ProcessChannel.sol generated.");
    })
    .catch(err => console.error(err));

    tsGenerator.compile(iNet)
    .then((gen) => {
      fs.writeFile("/generated/Enact.ts", gen.target, { flag: 'w+' },
      (err) => { if (err) { console.error(err); } });
      console.log("Enact.ts generated.");
    })
    .catch(err => console.error(err));

    solGenerator.compile(iNet)
    .then((gen) => {
      fs.writeFile("generated/ProcessEnactment.sol", gen.target, { flag: 'w+' },
      (err) => { if (err) { console.error(err); } });
      console.log("ProcessEnactment.sol generated.");
    })
    .catch(err => console.error(err));
});

```

## Run & Tests

If you have node isntalled a simple `npm install` is enough. To confirm, you can execute tests using `npm run test`. 

Two groups of tests exist:
- **Testing the parser and compiler**: By running `npm run test/compiler`, tests are executed confirming that the parser and compiler produce outputs from a range of correct and supported process models without reporting errors and rejects malformed and unsupported BPMN elements with reporting errors. These tests are found in `tests/compiler`.
- **Testing the generated output:** By running `npm run test/output`, tests are executed confirming that the produced outputs are valid artefacts. Currently, only  channels are tested by deploying the generated smart contracts on a mock blockchain (we plan to extend the testing setup, see https://github.com/fstiehle/chorpiler/issues/3). Gas cost are also reported. These tests are found in `tests/output`.

`npm run test` runs both test groups.

## Architecture
> [!NOTE]
> More on this soon.

## Theory
> [!NOTE]
> Chorpiler is based on---and used in---scientific work. More on this soon.

### Petri net generation

Our approach is based on the optimised translation technique presented in Garćıa-Bañuelos et al. [1]: a process model is converted into a Petri net, and
this net is reduced according to well-established equivalence rules. In the smart contract, the process state is then encoded as a bit array. Our approach is based on interaction Petri nets, which are a special kind of labelled Petri nets. Interaction Petri nets have been proposed as the formal basis for BPMN choreographies [2]. As labels, they store the initiator and respondent information, which are essential for the channel construction. After conversion, we apply the same reduction rules as in [1]. 

In contrast to [1], we must restrict enforcement to certain roles: only initiators are allowed to enforce tasks.3 Thus, in our approach, we can differentiate between manual and autonomous transitions. Manual transitions correspond to tasks that are initiated by a participant; these must be explicitly executed. Autonomous transitions are the remaining silent transitions. Converting a process model into a Petri net creates silent transitions. While most of them can be deleted through reduction, some can not be removed without creating infinite-loops [1]. These transitions must then be performed by the blockchain autonomously, given that the correct conditions are met. Consequently, these transitions are not bound to a role. The differentiation allows a more efficient execution: if the conditions for a manual task are met, it is fired and terminated; further autonomous transitions may be fired, without requiring further manual transitions.

![Petri net generation](https://github.com/fstiehle/chorpiler/blob/main/docs/figs/transformation.svg)

[1]: Garćıa-Bañuelos, L., Ponomarev, A., Dumas, M., Weber, I.: Optimized Execution
of Business Processes on Blockchain. In: BPM. Springer, Cham (2017) 130–146

[2]: Decker, G., Weske, M.: Local enforceability in interaction Petri nets. In: BPM.
Volume 4714 of LNCS., Springer, Cham (2007) 305–319
