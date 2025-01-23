//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract RA_ProcessExecution {
  uint public tokenState = 1;
  address[3] public participants;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }


  function enact(uint id) external {
    uint _tokenState = tokenState;
    
    while(_tokenState != 0) {
      if (bond > 4 * weeklyRent && (_tokenState & 2698 == 2698)) {
        _tokenState &= ~uint(2698);
        _tokenState |= 0;
        break; // is end
      }
      if ((_tokenState & 20 == 20)) {
        _tokenState &= ~uint(20);
        _tokenState |= 32;
        continue;
      }
      break;
    }

    while(true) {
      if (0 == id && (_tokenState & 2 == 2) && msg.sender == participants[0]) {
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        break;
      }
      if (1 == id && (_tokenState & 8 == 8) && msg.sender == participants[0]) {
        _tokenState &= ~uint(8);
        _tokenState |= 16;
        break;
      }
      if (2 == id && (_tokenState & 32 == 32) && msg.sender == participants[2]) {
        _tokenState &= ~uint(32);
        _tokenState |= 64;
        break;
      }
      if (3 == id && (_tokenState & 64 == 64) && msg.sender == participants[0]) {
        _tokenState &= ~uint(64);
        _tokenState |= 128;
        break;
      }
      if (4 == id && (_tokenState & 64 == 64) && msg.sender == participants[0]) {
        _tokenState &= ~uint(64);
        _tokenState |= 256;
        break;
      }
      if (5 == id && (_tokenState & 256 == 256) && msg.sender == participants[1]) {
        _tokenState &= ~uint(256);
        _tokenState |= 512;
        break;
      }
      if (6 == id && (_tokenState & 32 == 32) && msg.sender == participants[2]) {
        _tokenState &= ~uint(32);
        _tokenState |= 1024;
        break;
      }
      if (7 == id && (_tokenState & 1024 == 1024) && msg.sender == participants[1]) {
        _tokenState &= ~uint(1024);
        _tokenState |= 2048;
        break;
      }
      return;
    }

    tokenState = _tokenState;
  }
}