{{#each subProcesses}}
function {{modelID}}(uint id) external {
  {{> states}}
}
{{/each}}