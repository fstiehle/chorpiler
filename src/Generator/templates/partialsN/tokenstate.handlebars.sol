{{!// ---- instance support ----- }}
{{#if isInstanced}}
{{#if hasSubProcesses}}
{{!// ---- sub process ----- }}
processData[instanceID].tokenState[{{id}}]{{! (Remove Whitespace) ~}}
{{else}}
{{!// ---- no sub process ----- }}
processData[instanceID].tokenState{{! (Remove Whitespace) ~}}
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