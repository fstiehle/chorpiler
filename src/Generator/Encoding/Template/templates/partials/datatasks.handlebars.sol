{{#each dataTasks}}

function {{{modelID}}}({{#if isInstanced}}uint instanceID, {{/if}}{{{type}}} _{{{name}}}) external {
  require({{> tokenstate }} & {{{consume}}} == {{{consume}}});
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
  {{#if subProcessCallback}}
  {{subProcessCallback}}({{#if isInstanced}}instanceID, {{/if}}{{taskID}});
  {{else}}
  enact({{#if isInstanced}}instanceID, {{/if}}{{taskID}});
  {{/if}}
}
{{/each}}