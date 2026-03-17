uint _tokenState = {{> tokenstate }};
{{! --------------------- }}
{{#if options.debug}}
console.log(
  "{{{modelID}}}: current token state is %d, sender %s trying to execute task %d",
  _tokenState,
  msg.sender,
  id
);
{{! --------------------- }}
{{/if}}
while(_tokenState != 0) {
  {{#each states}}
  if (_tokenState & {{{consume}}} == {{{consume}}}) {
    {{#each transitions}}
    {{#if ../isDecision}}
    {{#if this.defaultBranch}}
    else {
      {{> conditional }}
    }
    {{else}}
    if ({{{decision}}}) {
      {{> conditional }}
    }
    {{/if}}
    {{else}}
    {{> conditional }}
    {{/if}}
    {{/each}}
  }
  {{/each}}
  break;
}

{{> tokenstate }} = _tokenState;

{{#if options.debug}}
console.log(
  "{{{modelID}}}: new token state is %d",
   _tokenState
);
{{/if}}
