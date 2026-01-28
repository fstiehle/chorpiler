{{^hasSubProcesses}}
uint _tokenState = tokenState;
{{/hasSubProcesses}}
{{#hasSubProcesses}}
uint _tokenState = tokenState[{{id}}];
{{/hasSubProcesses}}

{{#options.debug}}
console.log(
  "{{{modelID}}}: current token state is %d, sender %s trying to execute task %d",
  _tokenState,
  msg.sender,
  id
);
{{/options.debug}}
while(_tokenState != 0) {
  {{#states}}
  if (_tokenState & {{{consume}}} == {{{consume}}}) {
    {{#transitions}}
    {{#isDecision}}
    {{^defaultBranch}}
    if ({{{decision}}}) {
    {{/defaultBranch}}
    {{#defaultBranch}}
    else {
    {{/defaultBranch}}
      {{> conditional }}
    }
    {{/isDecision}}
    {{^isDecision}}
    {{> conditional }}
    {{/isDecision}}
    {{/transitions}}
  }
  {{/states}}
  break;
}

{{^hasSubProcesses}}
tokenState = _tokenState;
{{/hasSubProcesses}}
{{#hasSubProcesses}}
tokenState[{{id}}] = _tokenState;
{{/hasSubProcesses}}
{{#options.debug}}
console.log(
  "{{{modelID}}}: new token state is %d",
   _tokenState
);
{{/options.debug}}
