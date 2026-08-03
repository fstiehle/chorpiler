{{!// ---- instance support ----- }}
{{#if isInstanced}}
{{#if hasSubProcesses}}
{{!// ---- sub process ----- }}
instanceData[instanceID].state.tokenState[{{id}}]{{! (Remove Whitespace) ~}}
{{else}}
{{!// ---- no sub process ----- }}
instanceData[instanceID].state.tokenState{{! (Remove Whitespace) ~}}
{{/if}}
{{else}}
{{!// ---- uninstanced support ----- }}
{{#if hasSubProcesses}}
{{!// ---- sub process ----- }}
tokenState[{{id}}]{{! (Remove Whitespace) ~}}
{{else}}
{{!// ---- no sub process ----- }}
tokenState{{! (Remove Whitespace) ~}}
{{/if}}
{{/if}}