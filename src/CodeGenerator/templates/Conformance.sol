//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Conformance {

  uint tokenState = 1;
  address[{{numberOfParticipants}}] private participants;
  event NonConformingAttempt(uint id, address by);
  event EndEvent();

  constructor(address[{{numberOfParticipants}}] memory _participants) {
    participants = _participants;
  }

  function enact(uint id) external pure returns (uint) {
      /* We need to filter these states out before compilation
      if (id == 2 || id == 4 || id == 6 || id > 12) {
          // only used for internal orchestration
          return tokenState;
      } */

    {{#transitions}}
    if ({{{.id}}} == id && (tokenState & {{{.consume}}} == {{{.consume}}})) {
      tokenState &= ~uint({{{.consume}}});
      tokenState |= {{{.produce}}};
    }
    {{/transitions}}
    
    return tokenState;
  }

  function route(uint taskID) external pure returns (uint) {
    return 99;
  }
}