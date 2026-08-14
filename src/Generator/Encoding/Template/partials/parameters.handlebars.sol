{{!// ---- Call Support ----- }}
{{#if hasCalls}}
bytes32[{{{numberOfCalls}}}] private instanceList; // instanceIDs for calls
uint private nextID; // nonce list for calls
{{#if options.events}}
event NewInstance(uint id, bytes32 instanceID);
{{/if}}
{{/if}}
{{!// ---- Instance Support: list of process data ----- }}
{{#if isInstanced}}
mapping(bytes32 => IProcessInstance.InstanceData) public instanceData;
{{else}}
{{!// ---- Non-Instanced Contract ----- }}
{{!// ---- Sub Process Support ----- }}
{{#if hasSubProcesses}}
uint[{{{numberOfProcesses}}}] public tokenState;
{{else}}
uint private tokenState = 1;
{{/if}}
{{!// ---- Participant list ----- }}
address[{{{numberOfParticipants}}}] public participants;
{{/if}}
{{!// ---- Event Support ----- }}
{{#if options.events}}
event Task(uint id);{{!// No Whitespace ~}}
{{/if}}