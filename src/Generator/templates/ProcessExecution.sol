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

    {{#transitions}}
    {{#hasPreAutoTransitions}}
    while(_tokenState != 0) {
      {{#preAuto}}
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
      {{/preAuto}}
      break;
    }
    {{/hasPreAutoTransitions}}

    {{#hasManualTransitions}}
    while(_tokenState != 0) {
      {{#manual}}
      {{#if}}
      if ({{#condition}}({{{condition}}}) && {{/condition}}{{{id}}} == id && (_tokenState & {{{consume}}} == {{{consume}}}){{#initiator}} && msg.sender == participants[{{{initiator}}}]{{/initiator}}) {
        _tokenState &= ~uint({{{consume}}});
        _tokenState |= {{{produce}}};
        break;
      }
      {{/if}}
      {{/manual}}
      return;
    }
    {{/hasManualTransitions}}

    {{#hasPostAutoTransitions}}
    while(_tokenState != 0) {
      {{#postAuto}}
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
      {{/postAuto}}
      break;
    }
    {{/hasPostAutoTransitions}}
    {{/transitions}}

    tokenState = _tokenState;
  }
}