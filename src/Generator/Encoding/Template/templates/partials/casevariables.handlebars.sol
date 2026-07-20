{{#each caseVariables}}
// Case Variable {{{name}}}
{{#unless isInstanced}}
{{!// ---- Initialise uninstanced variables ----- }}
{{{expression}}}
{{/unless}}

{{!// ---- Setter ----- }}
{{#if setters}}
function {{{functionName}}}({{#if isInstanced}}uint instanceID, {{/if}}{{{type}}} _{{{name}}}) external {
  {{> variableassign}}
}
{{/if}}
{{/each}}