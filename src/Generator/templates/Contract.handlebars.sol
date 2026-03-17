//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

{{#if options.debug}}
import "hardhat/console.sol";
{{/if}}

{{> interfaces }}

{{! ---- // List/declarations of called contracts and their interfaces ---- }}
{{> calls}}

contract {{{modelID}}} is IProcessExecution {
  {{> parameters}}

  {{> casevariables}}

  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
    {{!// ---- Sub Process Support: If no sub process, tokenState = 1 is set directly in parameters ----- }}
    {{#if hasSubProcesses}}
    tokenState[0] = 1;
    {{/if}}
  }

  function getTokenState() external view returns (uint) {
    {{!// ---- Sub Process Support ----- }}
    {{#if hasSubProcesses}}
    return tokenState[0];
    {{else}}
    return tokenState;
    {{/if}}
  }

  {{! ---- // Tasks that set casevariables ---- }}
  {{> datatasks}}
  {{! ---- // Whitespace ---- }}
  {{! ---- // Main Enact Function ---- }}
  function enact(uint id) external {
    {{> states}}
  }

  {{! ---- // Sub process enactment functions ---- }}
  {{> subprocesses }}
}
