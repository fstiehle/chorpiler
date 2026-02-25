//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

{{#options.debug}}
import "hardhat/console.sol";

{{/options.debug}}
{{#hasCalls}}
interface IInstanceExecution {
  function instance(address[] memory participants) external returns (uint);
  function enact(uint instance, uint id) external;
  function getTokenState(uint instance) external view returns (uint);
}

{{#callList}}
{{> callcontract}}

{{/callList}}

{{/hasCalls}}
interface IProcessExecution {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}

contract {{{modelID}}} is IProcessExecution {
  {{#hasCalls}}
  uint[{{{numberOfCalls}}}] private instanceList; // instance
  {{/hasCalls}}
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

  function enact(uint id) external {
    {{> execution}}
  }

  {{#subProcesses}}
  function {{modelID}}(uint id) external {
    {{> execution}}
  }

  {{/subProcesses}}
}
