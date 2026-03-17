{{#each taskWithCaseVar}}
function {{{modelID}}}({{#if isInstanced}}uint instance, {{/if}}{{{type}}} _{{{name}}}) external {
  require(tokenState & {{{consume}}} == {{{consume}}});
  {{{conditionString}}}

  {{> variableassign}}
  {{> tokenstate }} |= {{{produce}}};

  {{! // ---- Debug Support ---- }}
  {{#if options.debug}}
  console.log(
    "{{{modelID}}}: new token state is %d",
    _tokenState
  );
  {{/if}}
  {{! // ---- Continue process loop ---- }}
  if (tokenState != 0) {
    enact(0);
  }
}
{{! // ---- Add Whitespace ---- }}
{{/each}}