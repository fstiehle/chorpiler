{{#each caseVariables}}
{{#unless isInstanced}}
// Case Variable {{{name}}}
{{!// ---- Initialise uninstanced variables ----- }}
{{{type}}} {{{visibility}}} {{{name}}} = {{{defaultValue}}};
{{/unless}}

{{!// ---- Setter ----- }}
{{#if setters}}
function {{{functionName}}}({{#if isInstanced}}bytes32 instanceID, {{/if}}{{{type}}} _{{{name}}}) external {
  {{> variableassign}}
}
{{/if}}
{{/each}}