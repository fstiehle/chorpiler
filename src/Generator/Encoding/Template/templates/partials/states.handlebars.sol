{{!// ---- Channel Support: Allow execution only if on-chain contract is unlocked ---- }}
{{#if isChannel}}
// TODO: Channel Spervermerk
{{/if}}

{{!// ---- Performance: cache state in var ---- }}
uint _tokenState = {{> tokenstate }};

{{!// ---- Debug Support ----- }}
{{#if options.debug}}
console.log(
  "{{{modelID}}}: current token state is %d, sender %s trying to execute task %d",
  _tokenState,
  msg.sender,
  id
);

{{/if}}
{{!// ---- Main states loop ----- }}
while(_tokenState != 0) {
  {{#each states}}
  if (_tokenState & {{{consume}}} == {{{consume}}}) {
    {{> transitions }}
  }
  {{/each}}
  break;
}

{{> tokenstate }} = _tokenState;

{{!// ---- Debug Support ----- }}
{{#if options.debug}}
console.log(
  "{{{modelID}}}: new token state is %d",
   _tokenState
);
{{/if}}