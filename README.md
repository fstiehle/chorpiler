# Chorpiler
> 2.0 Pre-Release WIP Version

[![Node.js CI](https://github.com/fstiehle/chorpiler/actions/workflows/node.js.yml/badge.svg)](https://github.com/fstiehle/chorpiler/actions/workflows/node.js.yml)
- A compiler to transform BPMN 2.0 models to efficient smart contract components, based on petri-net reductions.
- Current targets supported: Solidity Smart Contracts, [Algorand TEAL Contracts](https://github.com/fstiehle/chorpiler-algorandvm) (Chorpiler v1)

## Overview

Chorpiler is a tool to transform a BPMN choreography model into a Solidity state-machine  contract that encodes the process. The contract will enforce the order of task execution, including data-based decisions, and the authorisation (correct participant exeucting the task).
Chorpiler has additional tools that help with testing and interacting with such contracts. Chorpiler supports the following choreography elements.

| Element            | Supported  |
|--------------------|------------|
| Choreography tasks | ✔          |
| Events             | Start, End |
| Gateways           | XOR, EVENT, AND |
| Messages           | ✔* |
| Sub-Choreographies           | ✔ |
| Call-Choreographies           | ✔ |
| Case Variables  | ✔          |
| Looping behaviour  | ✔          |
| Uncontrolled flow merge  | ✔          |

* Messages are used to enforce data events, see _Case Variables & Data-Based Decisions_ below

## Usage

Install and use through your prefered [package](https://www.npmjs.com/package/chorpiler) manager.

E.g.,
```
npm install chorpiler
```

See below example.

Complete example usage to parse and generate.
```ts
import * as fs from 'fs';
import chorpiler, { TriggerEncoding } from 'chorpiler';

const parser = new chorpiler.Parser();

const bpmnXML = fs.readFileSync(path.join("./docs/examples/pizza.bpmn"));
// parse BPMN file
const iNet = await parser.fromXML(bpmnXML);

const contractGenerator =
  new chorpiler.generators.sol.DefaultContractGenerator(iNet[0]);

// compile to smart contract
return contractGenerator
  .compile()
  .then((gen) => {
    fs.writeFileSync("Process.sol", gen.target, { flag: "w+" });
    // console.log("Process.sol generated.");
    assert(TriggerEncoding.toJSON(gen.encoding));
    // log encoding of participants and tasks,
    // console.log(TriggerEncoding.toJSON(gen.encoding));
    // can also be written to a .json file
  })
  .catch((err) => console.error(err));
```
- Note, you can also import the corresponding types directly.
- You can enable parallel instance support `new SolChannelContractGenerator(iNet[0], true);`.
- You can enable event emission and debug console.logs by passing a `CompileOptions` object to the generator; e.g., `new SolChannelContractGenerator(iNet[0], false, { events: true, debug: "foundry" });`.

### Case Variables & Data-Based Decisions

Chorpiler will enforce data-based XOR decisions. Consider the following toy example.

![XOR example](https://github.com/fstiehle/chorpiler/blob/release/v2/docs/figs/xor.bpmn.svg)

The default-flow (upper path) is taken, unless the condition `items==true` is satisfied. Conditions can be defined as follows. (Also graphically; for example, through the properties panel of [chor-js](https://bpt-lab.org/chor-js-demo/).)

```xml
<bpmn2:sequenceFlow id="Flow_1uhdzct" sourceRef="Gateway_1td68h3" targetRef="ChoreographyTask_1b2vkz9">
      <bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression" language="Solidity">items==true</bpmn2:conditionExpression>
    </bpmn2:sequenceFlow>
```
In code, you can define the corresponding case variable.
```ts
const contractGenerator = new DefaultContractGenerator((iNet[0]);
contractGenerator.addCaseVariable(
  new CaseVariable("items", "bool", "false", true, "public"),
  // name of the variable, type of the variable, initial value, whether setters should be generated, and the variable's visibility.
);
```
#### Enforcement through Messages

Likely, you want to restrict when and who can update case variables. This can be done through explicitly defining messages. For example, to only allow `items` to be written by the customer when she places the order initially, model as follows.

![XOR example](https://github.com/fstiehle/chorpiler/blob/release/v2/docs/figs/xor-messages.bpmn.svg)

Chorpiler will generate a dedicated data task.
```sol
function ChoreographyTask_0hy9n0g(bool _items) external {
    require(tokenState & 1 == 1);
    require(msg.sender == participants[0], "Invalid initiator");

    items = _items;

    enact(1);
  }
```
- Note, If you want to restrict writting, make sure _to not_ generate public setters for the case variable, e.g., `new CaseVariable("items", "bool", "false", false, "public");`

### Interacting with Contracts

> TODO: describe encodings and
isEnabled(), give VIM example

### Advanced: Tools to Help Testing Your Contracts
> TODO:
Simulator howto

### Beta: Sub-Choreographies & Call-Choreographies
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
