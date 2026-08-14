{{!// ---- Instanced Contract: No constructor but instance() ---- }}
{{#if isInstanced}}
function instance(uint _nonce, address[{{{numberOfParticipants}}}] memory _participants) external returns (bytes32) {
  bytes32 id = keccak256(
    abi.encode(
      _nonce,
      _participants
    )
  );
  // write to channel if id doesn't exist yet
  {{#if hasSubProcesses}}
  require(
    instanceData[id].state.tokenState[0] == 0,
    "instance already exists"
  );
  uint[{{{numberOfProcesses}}}] memory newTokenState;
  newTokenState[0] = 1;
  {{else}}
  require(
    instanceData[id].state.tokenState == 0,
    "instance already exists"
  );
  {{/if}}
  instanceData[id] = IProcessInstance.InstanceData({
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
  {{!// ---- Debug Support ----- }}
  {{#if options.debug}}
  console.log("{{{modelID}}}: new instance registered with ID (see below)"); console.logBytes32(id);
  {{/if}}
  return id;
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