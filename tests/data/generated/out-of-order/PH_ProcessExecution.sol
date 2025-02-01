//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract PH_ProcessExecution {
  uint public tokenState = 1;
  address[5] public participants;

  constructor(address[5] memory _participants) {
    participants = _participants;
  }


  function enact(uint id) external {
    uint _tokenState = tokenState;
    
    while(_tokenState != 0) {
      if (3 == id && (_tokenState & 1 == 1)) {
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        continue;
      }
      if ((_tokenState & 1 == 1)) {
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        continue;
      }
      break;
    }

    while(_tokenState != 0) {
      if (0 == id && (_tokenState & 4 == 4) && msg.sender == participants[3]) {
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        break;
      }
      if (1 == id && (_tokenState & 16 == 16) && msg.sender == participants[4]) {
        _tokenState &= ~uint(16);
        _tokenState |= 32;
        break;
      }
      if (2 == id && (_tokenState & 8 == 8) && msg.sender == participants[4]) {
        _tokenState &= ~uint(8);
        _tokenState |= 64;
        break;
      }
      if (3 == id && (_tokenState & 2 == 2) && msg.sender == participants[0]) {
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        break;
      }
      if (4 == id && (_tokenState & 128 == 128) && msg.sender == participants[1]) {
        _tokenState &= ~uint(128);
        _tokenState |= 256;
        break;
      }
      if (5 == id && (_tokenState & 256 == 256) && msg.sender == participants[4]) {
        _tokenState &= ~uint(256);
        _tokenState |= 16;
        break;
      }
      if (6 == id && (_tokenState & 64 == 64) && msg.sender == participants[2]) {
        _tokenState &= ~uint(64);
        _tokenState |= 128;
        break;
      }
      return;
    }

    while(_tokenState != 0) {
      if ((_tokenState & 32 == 32)) {
        _tokenState &= ~uint(32);
        _tokenState |= 0;
        break; // is end
      }
      break;
    }

    tokenState = _tokenState;
  }
}