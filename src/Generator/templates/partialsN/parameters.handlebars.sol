{{!// ---- Call Support ----- }}
{{#if hasCalls}}
uint[{{{numberOfCalls}}}] private instanceList; // instanceIDs for calls
{{#if options.events}}
event NewInstance(uint id, uint instanceID);
{{/if}}
{{/if}}
{{!// ---- Sub Process Support ----- }}
{{#if hasSubProcesses}}
uint[{{{numberOfProcesses}}}] public tokenState;
{{else}}
uint private tokenState = 1;
{{/if}}
{{!// ---- Participant Role-Bindind ----- }}
address[{{{numberOfParticipants}}}] public participants;
{{!// ---- Event Support ----- }}
{{#if options.events}}
event Task(uint id);
{{/if}}