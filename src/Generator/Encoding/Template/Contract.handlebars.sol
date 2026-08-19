//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

{{#if options.debug}}
{{#if (isString options.debug)}}
import "{{options.debug}}";
{{else}}
import "hardhat/console.sol";
{{/if}}

{{/if}}
{{> interfaces }}

{{! ---- // List/declarations of called contracts and their interfaces ---- }}
{{> calls}}

contract {{{modelID}}} is {{#if isInstanced}}IProcessInstance{{else}}IProcess{{/if}} {
  {{> parameters }}

  {{> casevariables }}

  {{> constructor }}

  function getTokenState({{#if isInstanced}}bytes32 instanceID{{/if}}) external view returns (uint) {
    return {{> tokenstate id=0 }};
  }

  {{! ---- // Main Enact Function ---- }}
  function enact({{#if isInstanced}}bytes32 instanceID, {{/if}}uint id) {{#if hasDataTasks}}public{{else}}external{{/if}} {
    {{> states }}
  }
  {{! ---- // Tasks that set casevariables ---- }}
  {{> datatasks }}

  {{! ---- // Sub process enactment functions ---- }}
  {{> subprocesses }}
}
