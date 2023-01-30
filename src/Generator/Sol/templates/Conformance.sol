//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Conformance {
  uint private tokenState = 1;
  // TODO: better performance with mapping?
  address[{{{numberOfParticipants}}}] private immutable participants;

  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
  }

  function enact(uint id) {{{enactmentVisibility}}} returns (uint) {
    {{#manualTransitions}}
    if ({{#initiator}}msg.sender == participants[{{{initiator}}}] && {{/initiator}}{{{id}}} == id && (tokenState & {{{consume}}} == {{{consume}}})) {
      tokenState &= ~uint({{{consume}}});
      tokenState |= {{{produce}}};
    }
    {{/manualTransitions}}
    {{#autonomousTransitions}}
    if (tokenState & {{{consume}}} == {{{consume}}}) {
      tokenState &= ~uint({{{consume}}});
      tokenState |= {{{produce}}};
    }
    {{/autonomousTransitions}}
    return tokenState;
  }
}