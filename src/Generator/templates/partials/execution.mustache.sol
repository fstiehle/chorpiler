{{^hasSubProcesses}}
uint _tokenState = tokenState;
{{/hasSubProcesses}}
{{#hasSubProcesses}}
uint _tokenState = tokenState[{{id}}];
{{/hasSubProcesses}}

while(_tokenState != 0) {
  {{#states}}
  if (_tokenState & {{{consume}}} == {{{consume}}}) {
  {{#transitions}} 
    {{> transition }}
  {{/transitions}} 
  {{#defaultBranch}} 
    {{> transition }}
  {{/defaultBranch}}
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