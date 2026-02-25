//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

{{#options.debug}}
import "hardhat/console.sol";

{{/options.debug}}
interface IInstanceExecution {
  struct ProcessData {
    address[2] participants;
    {{^hasSubProcesses}}
    uint tokenState;
    {{/hasSubProcesses}}
    {{#hasSubProcesses}}
    uint[{{{numberOfProcesses}}}] public tokenState;
    {{/hasSubProcesses}}
    {{#caseVariables}}
    {{{expression}}}
    {{/caseVariables}}
  }
  function enact(uint instanceID, uint id) external;
  function getTokenState(uint instanceID) external view returns (uint);
  function instance(address[{{{numberOfParticipants}}}] memory participants) external returns (uint);
}

{{#hasCalls}}
{{#addressList}}
{{> callcontract}}

{{/addressList}}

{{/hasCalls}}
contract {{{modelID}}} is IInstanceExecution {
  mapping(uint => IInstanceExecution.ProcessData) public processData;
  uint private nextId = 0;
  {{#hasCalls}}
  address[{{{numberOfCalls}}}] private instanceList;
  {{/hasCalls}}
  {{#options.events}}
  event Task(uint id);
  {{/options.events}}

  {{#caseVariables}}
  {{> casevariable}}

  {{/caseVariables}}
  function instance(address[{{{numberOfParticipants}}}] memory _participants) external returns (uint) {
    uint newId = nextId;
    processData[newId] = IInstanceExecution.ProcessData({
      participants: _participants,
      {{^hasSubProcesses}}
      tokenState: 1
      {{/hasSubProcesses}}
      {{#hasSubProcesses}}
      tokenState[0]: 1
      {{/hasSubProcesses}}
    });
    return newId;
  }

  function getTokenState(uint instanceID) external view returns (uint) {
    {{^hasSubProcesses}}
    return processData[instanceID].tokenState;
    {{/hasSubProcesses}}
    {{#hasSubProcesses}}
    return processData[instanceID].tokenState[0];
    {{/hasSubProcesses}}
  }

  function enact(uint instanceID, uint id) external {
    {{> execution}}
  }

  {{#subProcesses}}
  function {{modelID}}(uint instanceID, uint id) external {
    {{> execution}}
  }

  {{/subProcesses}}
}
