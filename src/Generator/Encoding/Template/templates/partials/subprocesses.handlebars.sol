{{#each subProcesses}}
function {{modelID}}({{#if isInstanced}}uint instanceID, {{/if}}uint id) {{#if hasDataTasks}}public{{else}}external{{/if}} {
  {{> states}}
}

{{/each}}