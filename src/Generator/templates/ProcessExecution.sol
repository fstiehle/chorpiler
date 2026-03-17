//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

{{#if options.debug}}
import "hardhat/console.sol";

{{/if}}
{{! --------------------- }}
{{#if hasCalls}}
interface IInstanceExecution {
  function instance(address[] memory participants) external returns (uint);
  function enact(uint instance, uint id) external;
  function getTokenState(uint instance) external view returns (uint);
}

{{#each callList}}
{{> callcontract}}

{{/each}}

{{/if}}
interface IProcessExecution {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}

contract {{{modelID}}} is IProcessExecution {
  {{#if hasCalls}}
  uint[{{{numberOfCalls}}}] private instanceList; // instance
  event NewInstance(uint id, uint instanceID);
  {{/if}}
  {{^hasSubProcesses}}
  uint private tokenState = 1;
  {{/hasSubProcesses}}
  {{#hasSubProcesses}}
  uint[{{{numberOfProcesses}}}] public tokenState;
  {{/hasSubProcesses}}
  address[{{{numberOfParticipants}}}] public participants;
  {{#options.events}}
  event Task(uint id);
  {{/options.events}}

  {{#caseVariables}}
  {{> casevariable}}

  {{/caseVariables}}
  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
    {{#hasSubProcesses}}
    tokenState[0] = 1;
    {{/hasSubProcesses}}
  }

  function getTokenState() external view returns (uint) {
    {{^hasSubProcesses}}
    return tokenState;
    {{/hasSubProcesses}}
    {{#hasSubProcesses}}
    return tokenState[0];
    {{/hasSubProcesses}}
  }

  {{#taskWithCaseVar}}
  function {{{modelID}}}({{#isInstanced}}uint instance, {{/isInstanced}}{{{message.caseVariable.type}}} _{{{message.caseVariable.name}}}) external {
    require(tokenState & {{{consume}}} == {{{consume}}});
    {{{conditionString}}}

    {{^isInstanced}}
    {{{message.caseVariable.name}}} = _{{{message.caseVariable.name}}};
    {{/isInstanced}}
    {{#isInstanced}}
    processData[instance].{{{message.caseVariable.name}}} = _{{{message.caseVariable.name}}}
    {{/isInstanced}}
    {{^hasSubProcesses}}
    {{^isInstanced}}
    tokenState = {{{produce}}};
    {{/isInstanced}}
    {{#isInstanced}}
    processData[instanceID].tokenState |= {{{produce}}};
    {{/isInstanced}}
    {{/hasSubProcesses}}
    {{#hasSubProcesses}}
    {{^isInstanced}}
    tokenState[{{id}}] |= {{{produce}}};
    {{/isInstanced}}
    {{#isInstanced}}
    processData[instanceID].tokenState[{{id}}] |= {{{produce}}};
    {{/isInstanced}}
    {{/hasSubProcesses}}
    {{! // --------------------- }}
    {{#if options.debug}}
    console.log(
      "{{{modelID}}}: new token state is %d",
       _tokenState
    );
    {{! Whitespace }}
    {{/if}}
    if (tokenState != 0) {
      enact(0);
    }
  }

  {{/taskWithCaseVar}}
  function enact(uint id) external {
    {{> execution}}
  }

  {{#each subProcesses}}
  function {{modelID}}(uint id) external {
    {{> execution}}
  }

  {{/each}}
}
