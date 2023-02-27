//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ProcessEnactment {
  uint public tokenState = 1;
  // TODO: better performance with mapping?
  address[{{{numberOfParticipants}}}] private participants;

  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
  }

  function enact(uint id) {{{enactmentVisibility}}} {
    {{#manualTransitions}}
    if ({{#initiator}}msg.sender == participants[{{{initiator}}}] && {{/initiator}}{{{id}}} == id && (tokenState & {{{consume}}} == {{{consume}}})) {
      tokenState &= ~uint({{{consume}}}) | {{{produce}}};
      return;
    }
    {{/manualTransitions}}
    while (true) {
      {{#autonomousTransitions}}
      if (tokenState & {{{consume}}} == {{{consume}}}) {
        tokenState &= ~uint({{{consume}}}) | {{{produce}}};
        continue;
      }
      {{/autonomousTransitions}}
      break;
    }
  }
}