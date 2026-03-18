{{#each subProcesses}}
function {{modelID}}({{#if isInstanced}}uint instanceID, {{/if}}uint id) external {
  {{> states}}
}

{{/each}}