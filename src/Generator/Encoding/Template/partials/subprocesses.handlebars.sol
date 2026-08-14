{{#each subProcesses}}
function {{modelID}}({{#if isInstanced}}bytes32 instanceID, {{/if}}uint id) {{#if hasDataTasks}}public{{else}}external{{/if}} {
  {{> states}}
}

{{/each}}