{{!// ---- Contract Interface ----- }}
{{!// ---- Support for Instanced Contract ----- }}
{{#if isInstanced}}
interface IProcessInstance {
  struct ProcessData {
    address[2] participants;
    {{!// ---- Sub Process Support ----- }}
    {{#if hasSubProcesses}}
    uint[{{{numberOfProcesses}}}] public tokenState;
    {{else}}
    uint tokenState;
    {{/if}}
    {{!// ---- Instanced Case Variables ----- }}
    {{#each caseVariables}}
    {{{expression}}}
    {{/each}}
  }
  function enact(uint instanceID, uint id) external;
  function getTokenState(uint instanceID) external view returns (uint);
  function instance(address[{{{numberOfParticipants}}}] memory participants) external returns (uint);
}
{{!// ---- Non-Instanced Contract ----- }}
{{else}}
interface IProcess {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}
{{/if}}