{{! // ----- Instanced Execution -----~}}
{{#if isInstanced}}
{{#if hasSubProcesses}}
processData[instanceID].tokenState[{{id}}]{{! (Remove Whitespace) ~}}
{{else}}
processData[instanceID].tokenState{{! (Remove Whitespace) ~}}
{{/if}}
{{else}}
{{! // ----- Non Instanced ------}}
{{#if hasSubProcesses}}
tokenState[{{id}}]{{! (Remove Whitespace) ~}}
{{else}}
tokenState{{! (Remove Whitespace) ~}}
{{/if}}
{{/if}}