{{!// ---- Call Support ----- }}
{{#if hasCalls}}
uint[{{{numberOfCalls}}}] private instanceList; // instanceIDs for calls
{{#if options.events}}
event NewInstance(uint id, uint instanceID);
{{/if}}
{{/if}}
{{!// ---- Instance Support: list of process data ----- }}
{{#if isInstanced}}
mapping(uint => IProcessInstance.ProcessData) public processData;
uint private nextId = 0;
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