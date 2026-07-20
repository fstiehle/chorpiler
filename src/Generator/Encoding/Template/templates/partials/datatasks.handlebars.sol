{{#each dataTasks}}

function {{{modelID}}}({{#if isInstanced}}uint instance, {{/if}}{{{type}}} _{{{name}}}) external {
  require(tokenState & {{{consume}}} == {{{consume}}});
  {{{conditionString}}}

  {{> variableassign}}

  {{! // ---- Debug Support ---- }}
  {{#if options.debug}}
  console.log(
    "Set {{{type}}} {{{name}}} to",
    _{{{name}}}
  );
  {{/if}}
  {{! // ---- Continue process loop ---- }}
  enact({{taskID}});
}
{{/each}}