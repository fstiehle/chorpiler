{{!// ---- Contract Interface ----- }}
{{!// ---- Support for Instanced Contract ----- }}
{{#if isInstanced}}
interface IProcessInstance {
  struct InstanceState {
    {{!// ---- Sub Process Support ----- }}
    {{#if hasSubProcesses}}
    uint[{{{numberOfProcesses}}}] public tokenState;
    {{else}}
    uint tokenState;
    {{/if}}
    {{!// ---- Instanced Case Variables ----- }}
    {{#each caseVariables}}
    {{{type}}} {{{name}}};
    {{/each}}
  }
  struct InstanceData {
    address[{{{numberOfParticipants}}}] participants;
    InstanceState state;
  }
  function enact(bytes32 instanceID, uint id) external;
  function getTokenState(bytes32 instanceID) external view returns (uint);
  function instance(uint nonce, address[{{{numberOfParticipants}}}] memory participants) external returns (bytes32);
}
{{!// ---- Non-Instanced Contract ----- }}
{{else}}
interface IProcess {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}
{{/if}}