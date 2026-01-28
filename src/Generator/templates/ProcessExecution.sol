//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

{{#options.debug}}
import "hardhat/console.sol";

{{/options.debug}}
interface IProcessExecution {
  function enact(uint id) external;
}

contract {{{modelID}}} is IProcessExecution {
  {{^hasSubProcesses}}
  uint public tokenState = 1;
  {{/hasSubProcesses}}
  {{#hasSubProcesses}}
  uint[{{{numberOfProcesses}}}] public tokenState;
  {{/hasSubProcesses}}
  address[{{{numberOfParticipants}}}] public participants;
  {{#options.events}}
  event Task(uint id);
  {{/options.events}}
  {{#caseVariables}}
  {{{expression}}}
  {{/caseVariables}}

  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
  }
  {{#caseVariables}}
  {{#setters}}

  function {{{functionName}}}({{{type}}} _{{{name}}}) external {
    {{{name}}} = _{{{name}}};
  }
  {{/setters}}
  {{/caseVariables}}

  function enact(uint id) external {
    {{> execution}}
  }

  {{#subProcesses}}
  function {{modelID}}(uint id) external {
    {{> execution}}
  }

  {{/subProcesses}}
}
