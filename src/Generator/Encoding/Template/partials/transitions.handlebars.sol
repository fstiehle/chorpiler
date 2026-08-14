{{#each transitions}}
{{#if isDecision}}
{{!// ---- decision requires an additional if/else flow ----- }}
{{#if isNotDefaultBranch}}
if ({{{decision}}}) {
{{else}}
else {
{{/if}}
  {{> transition }}
}
{{else}}
{{!// ---- no decision: no additional if/else flow needed ----- }}
{{> transition }}
{{/if}}
{{/each}}