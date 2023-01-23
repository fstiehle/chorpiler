//SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

contract Conformance {
  uint tokenState = 1;
  address[3] private participants;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function enact(uint id) external returns (uint) {
    if (0 == id && (tokenState & 1 == 1)) {
      tokenState &= ~uint(1);
      tokenState |= 2;
    }
    if (msg.sender == participants[1] && 1 == id && (tokenState & 2 == 2)) {
      tokenState &= ~uint(2);
      tokenState |= 4;
    }
    if (msg.sender == participants[2] && 2 == id && (tokenState & 4 == 4)) {
      tokenState &= ~uint(4);
      tokenState |= 2;
    }
    if (tokenState & 2 == 2) {
      tokenState &= ~uint(2);
      tokenState |= 8;
    }
    return tokenState;
  }
}