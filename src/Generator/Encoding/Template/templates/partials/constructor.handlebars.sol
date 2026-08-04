{{!// ---- Instanced Contract: No constructor but instance() ---- }}
{{#if isInstanced}}
function instance(address[{{{numberOfParticipants}}}] memory _participants) external returns (uint) {
  uint newId = nextId;
  {{#if hasSubProcesses}}
  uint[{{{numberOfProcesses}}}] memory newTokenState;
  newTokenState[0] = 1;
  {{/if}}
  instanceData[newId] = IProcessInstance.InstanceData({
    {{#if isChannel}}
    disputeMadeAtUNIX: 0,
    {{/if}}
    participants: _participants,
    state: IProcessInstance.InstanceState({
      {{#if isChannel}}
      index: 0,
      {{/if}}
      {{#if hasSubProcesses}}
      tokenState: newTokenState{{!// No Whitespace ~}}
      {{else}}
      tokenState: 1{{!// No Whitespace ~}}
      {{/if}}
{{!// Align Comma ~}}{{#each caseVariables}},
      {{{name}}}: {{defaultValue}}
      {{/each}}
    })
  });
  nextId = newId + 1;
  return newId;
}
{{else}}
{{!// ---- Non-Instanced Contract: normal constructor ---- }}
constructor(address[{{{numberOfParticipants}}}] memory _participants) {
  participants = _participants;
  {{!// ---- Sub Process Support: If no sub process, tokenState = 1 is set directly in parameters ----- }}
  {{#if hasSubProcesses}}
  tokenState[0] = 1;
  {{/if}}
}
{{/if}}