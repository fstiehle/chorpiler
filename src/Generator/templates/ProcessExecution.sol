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
    
    {{#hasPreAutoTransitions}}
    while(_tokenState != 0) {
      {{#preAutoTransitions}}
      {{#if}}
      if ({{#condition}}({{{condition}}}) && {{/condition}}{{#id}}{{{id}}} == id && {{/id}}(_tokenState & {{{consume}}} == {{{consume}}})) {
        _tokenState &= ~uint({{{consume}}});
        _tokenState |= {{{produce}}};
        {{#isEnd}}
        break; // is end
        {{/isEnd}}
        {{^isEnd}}
        continue;
        {{/isEnd}}
      }
      {{/if}}
      {{#else}}
      if ({{#condition}}({{{condition}}}) && {{/condition}}(_tokenState & {{{consume}}} == {{{consume}}})) {
        _tokenState &= ~uint({{{consume}}});
        _tokenState |= {{{produce}}};
        {{#isEnd}}
        break; // is end
        {{/isEnd}}
        {{^isEnd}}
        continue;
        {{/isEnd}}
      }
      {{/else}}
      {{/preAutoTransitions}}
      break;
    }
    {{/hasPreAutoTransitions}}

    {{#hasManualTransitions}}
    while(_tokenState != 0) {
      {{#manualTransitions}}
      {{#if}}
      if ({{#condition}}({{{condition}}}) && {{/condition}}{{{id}}} == id && (_tokenState & {{{consume}}} == {{{consume}}}){{#initiator}} && msg.sender == participants[{{{initiator}}}]{{/initiator}}) {
        _tokenState &= ~uint({{{consume}}});
        _tokenState |= {{{produce}}};
        break;
      }
      {{/if}}
      {{/manualTransitions}}
      return;
    }
    {{/hasManualTransitions}}

    {{#hasPostAutoTransitions}}
    while(_tokenState != 0) {
      {{#postAutoTransitions}}
      {{#if}}
      if ({{#condition}}({{{condition}}}) && {{/condition}}(_tokenState & {{{consume}}} == {{{consume}}})) {
        _tokenState &= ~uint({{{consume}}});
        _tokenState |= {{{produce}}};
        {{#isEnd}}
        break; // is end
        {{/isEnd}}
        {{^isEnd}}
        continue;
        {{/isEnd}}
      }
      {{/if}}
      {{/postAutoTransitions}}
      break;
    }
    {{/hasPostAutoTransitions}}

    tokenState = _tokenState;
  }
}