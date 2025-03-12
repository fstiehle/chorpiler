//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ProcessExecution {
  uint public tokenState = 1;
  address[{{{numberOfParticipants}}}] public participants;
  {{#caseVariables}}
  {{{expression}}}
  {{/caseVariables}}

  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
  }
  {{#caseVariables}}
  function set{{{name}}}({{{type}}} _{{{name}}}) external {
    {{{name}}} = _{{{name}}};
  }
  {{/caseVariables}}

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      {{#states}}
      if (_tokenState & {{{consume}}} == {{{consume}}}) {
      {{#transitions}} 
        {{> transition }}
      {{/transitions}}
      {{#else}} 
        {{> transition }}
      {{/else}}
      }
      {{/states}}
      break;
    }

    tokenState = _tokenState;
  }
}