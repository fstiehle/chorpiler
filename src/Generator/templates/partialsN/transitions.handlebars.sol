{{#each transitions}}
{{#if isDecision}}
{{!// ---- decision requires an additional if/else flow ----- }}
{{#if defaultBranch}}
else {
{{else}}
if ({{{decision}}}) {
{{/if}}
  {{> transition }}
}
{{/if}}
{{else}}
{{!// ---- no decision: no additional if/else flow needed ----- }}
{{> transition }}
{{/if}}
{{/each}}