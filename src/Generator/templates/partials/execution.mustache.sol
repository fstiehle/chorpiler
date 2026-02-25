{{^hasSubProcesses}}
{{^isInstanced}}
uint _tokenState = tokenState;
{{/isInstanced}}
{{#isInstanced}}
uint _tokenState = processData[instanceID].tokenState;
{{/isInstanced}}
{{/hasSubProcesses}}
{{#hasSubProcesses}}
{{^isInstanced}}
uint _tokenState = tokenState[{{id}}];
{{/isInstanced}}
{{#isInstanced}}
uint _tokenState = processData[instanceID].tokenState[{{id}}];
{{/isInstanced}}
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
{{^isInstanced}}
tokenState = _tokenState;
{{/isInstanced}}
{{#isInstanced}}
processData[instanceID].tokenState = _tokenState;
{{/isInstanced}}
{{/hasSubProcesses}}
{{#hasSubProcesses}}
{{^isInstanced}}
tokenState[{{id}}] = _tokenState;
{{/isInstanced}}
{{#isInstanced}}
processData[instanceID].tokenState[{{id}}] = _tokenState;
{{/isInstanced}}
{{/hasSubProcesses}}
{{#options.debug}}
console.log(
  "{{{modelID}}}: new token state is %d",
   _tokenState
);
{{/options.debug}}
