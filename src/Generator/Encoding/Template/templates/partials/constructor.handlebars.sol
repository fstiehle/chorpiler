{{!// ---- Instanced Contract: No constructor but instance() ---- }}
{{#if isInstanced}}
function instance(address[{{{numberOfParticipants}}}] memory _participants) external returns (uint) {
  uint newId = nextId;
  instanceData[newId] = IProcessInstance.InstanceData({
    participants: _participants,
    state: IProcessInstance.InstanceState({
      {{^hasSubProcesses}}
      tokenState: 1
      {{/hasSubProcesses}}
      {{#hasSubProcesses}}
      tokenState[0]: 1
      {{/hasSubProcesses}}
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