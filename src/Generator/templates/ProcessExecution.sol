//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

{{#options.debug}}
import "hardhat/console.sol";

{{/options.debug}}
interface IProcessExecution {
  function enact(uint id) external;
  function tokenState() external returns (uint);
}
{{#hasCalls}}

interface ICalledProcessExecution is IProcessExecution {
  function initiate() external;
}
{{/hasCalls}}

contract {{{modelID}}} is IProcessExecution {
  {{^hasSubProcesses}}
  {{^isCalled}}
  uint public tokenState = 1;
  {{/isCalled}}
  {{#isCalled}}
  address private calledBy;
  uint public tokenState;
  {{/isCalled}}
  {{/hasSubProcesses}}
  {{#hasSubProcesses}}
  uint[{{{numberOfProcesses}}}] public tokenState;
  {{/hasSubProcesses}}
  {{#hasCalls}}
  address[{{{numberOfCalls}}}] private callList;
  {{/hasCalls}}
  address[{{{numberOfParticipants}}}] public participants;
  {{#options.events}}
  event Task(uint id);
  {{/options.events}}
  {{#caseVariables}}
  {{{expression}}}
  {{/caseVariables}}

  constructor(
    address[{{{numberOfParticipants}}}] memory _participants{{#hasCalls}},
    address[{{{numberOfCalls}}}] memory _callList{{/hasCalls}}{{#isCalled}},
    address _calledBy{{/isCalled}}
  ) {
    participants = _participants;
    {{#callContracts}}
    callList = _callList;
    {{/callContracts}}
    {{^isCalled}}
    {{#hasSubProcesses}}
    tokenState[0] = 1;
    {{/hasSubProcesses}}
    {{/isCalled}}
    {{#isCalled}}
    calledBy = _calledBy;
    {{/isCalled}}
  }
  {{#caseVariables}}
  {{#setters}}

  function {{{functionName}}}({{{type}}} _{{{name}}}) external {
    {{{name}}} = _{{{name}}};
  }
  {{/setters}}
  {{/caseVariables}}
  {{#isCalled}}

  modifier onlyCalled() {
    require(msg.sender == calledBy);
    _;
  }

  function initiate() external onlyCalled {
    {{^hasSubProcesses}}
    tokenState = 1;
    {{/hasSubProcesses}}
    {{#hasSubProcesses}}
    tokenState[0] = 1;
    {{/hasSubProcesses}}
  }
  {{/isCalled}}

  function enact(uint id) external {
    {{> execution}}
  }

  {{#subProcesses}}
  function {{modelID}}(uint id) external {
    {{> execution}}
  }

  {{/subProcesses}}
}
