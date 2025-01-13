//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract PIZZA_ProcessExecution {
  uint public tokenState = 1;
  address[3] public participants;
  bool public items = false;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;
    
    while(_tokenState != 0) {
      if (3 == id && (_tokenState & 2 == 2)) {
        _tokenState &= ~uint(2);
        _tokenState |= 8;
        continue;
      }
      break;
    }

    while(true) {
      if (0 == id && (_tokenState & 1 == 1) && msg.sender == participants[0]) {
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        break;
      }
      if (items==true && 1 == id && (_tokenState & 2 == 2) && msg.sender == participants[0]) {
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        break;
      }
      if (2 == id && (_tokenState & 4 == 4) && msg.sender == participants[0]) {
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        break;
      }
      if (3 == id && (_tokenState & 8 == 8) && msg.sender == participants[0]) {
        _tokenState &= ~uint(8);
        _tokenState |= 0;
        break;
      }
      return;
    }

    tokenState = _tokenState;
  }
}