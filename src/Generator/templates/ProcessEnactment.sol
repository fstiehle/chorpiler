//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ProcessEnactment {
  uint public tokenState = 1;
  // TODO: better performance with mapping?
  address[{{{numberOfParticipants}}}] public participants;

  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
  }

  function enact(uint id{{#hasConditions}}, uint cond{{/hasConditions}}) external {
    uint _tokenState = tokenState;
    
    {{#hasManualTransitions}}
    while(true) {
      {{#manualTransitions}}
        if ({{#condition}}(cond & {{{condition}}} == {{{condition}}}) && {{/condition}}{{#initiator}}msg.sender == participants[{{{initiator}}}] && {{/initiator}}{{{id}}} == id && (_tokenState & {{{consume}}} == {{{consume}}})) {
          _tokenState &= ~uint({{{consume}}});
          _tokenState |= {{{produce}}};
          break;
        }
      {{/manualTransitions}}
      return;
    }
    {{/hasManualTransitions}}

    {{#hasAutonomousTransitions}}
    while(_tokenState != 0) {
      {{#autonomousTransitions}}
      if ({{#condition}}(cond & {{{condition}}} == {{{condition}}}) && {{/condition}}(_tokenState & {{{consume}}} == {{{consume}}})) {
        _tokenState &= ~uint({{{consume}}});
        _tokenState |= {{{produce}}};
        {{#isEnd}}
        break; // is end
        {{/isEnd}}
        {{^isEnd}}
        continue;
        {{/isEnd}}
      }
      {{/autonomousTransitions}}
      break;
    }
    {{/hasAutonomousTransitions}}

    tokenState = _tokenState;
  }
}