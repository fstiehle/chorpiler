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
    {{#isDecision}}
    {{^last}}
    if ({{{decision}}}) {
    {{/last}}
    {{#last}}
    else {
    {{/last}}
      {{> transition }}
    }
    {{/isDecision}}
    {{^isDecision}}
    {{> transition }}
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