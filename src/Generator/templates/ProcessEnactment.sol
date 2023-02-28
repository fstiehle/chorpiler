//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ProcessEnactment {
  uint public tokenState = 1;
  // TODO: better performance with mapping?
  address[{{{numberOfParticipants}}}] public participants;

  constructor(address[{{{numberOfParticipants}}}] memory _participants) {
    participants = _participants;
  }

  function enact(uint id) external {
    uint _disputeMadeAtUNIX = disputeMadeAtUNIX;
    uint _tokenState = tokenState;

    do {
      {{#manualTransitions}}
        if ({{#initiator}}msg.sender == participants[{{{initiator}}}] && {{/initiator}}{{{id}}} == id && (_tokenState & {{{consume}}} == {{{consume}}})) {
          _tokenState &= ~uint({{{consume}}});
          _tokenState |= {{{produce}}};
          break;
        }
      {{/manualTransitions}}
    } while (false);

    while(_tokenState != 0) {
      {{#autonomousTransitions}}
      if (_tokenState & {{{consume}}} == {{{consume}}}) {
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

    tokenState = _tokenState;
  }
}