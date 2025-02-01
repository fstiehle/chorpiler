//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SC_ProcessExecution {
  uint public tokenState = 1;
  address[5] public participants;

  constructor(address[5] memory _participants) {
    participants = _participants;
  }


  function enact(uint id) external {
    uint _tokenState = tokenState;
    
    while(_tokenState != 0) {
      if (0 == id && (_tokenState & 1 == 1)) {
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        continue;
      }
      if ((_tokenState & 8 == 8)) {
        _tokenState &= ~uint(8);
        _tokenState |= 80;
        continue;
      }
      if (4 == id && (_tokenState & 160 == 160)) {
        _tokenState &= ~uint(160);
        _tokenState |= 256;
        continue;
      }
      if ((_tokenState & 1 == 1)) {
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        continue;
      }
      if ((_tokenState & 8 == 8)) {
        _tokenState &= ~uint(8);
        _tokenState |= 80;
        continue;
      }
      if ((_tokenState & 160 == 160)) {
        _tokenState &= ~uint(160);
        _tokenState |= 256;
        continue;
      }
      break;
    }

    while(_tokenState != 0) {
      if (0 == id && (_tokenState & 2 == 2) && msg.sender == participants[0]) {
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        break;
      }
      if (1 == id && (_tokenState & 4 == 4) && msg.sender == participants[4]) {
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        break;
      }
      if (2 == id && (_tokenState & 16 == 16) && msg.sender == participants[1]) {
        _tokenState &= ~uint(16);
        _tokenState |= 32;
        break;
      }
      if (3 == id && (_tokenState & 64 == 64) && msg.sender == participants[1]) {
        _tokenState &= ~uint(64);
        _tokenState |= 128;
        break;
      }
      if (4 == id && (_tokenState & 256 == 256) && msg.sender == participants[3]) {
        _tokenState &= ~uint(256);
        _tokenState |= 512;
        break;
      }
      if (5 == id && (_tokenState & 512 == 512) && msg.sender == participants[2]) {
        _tokenState &= ~uint(512);
        _tokenState |= 1024;
        break;
      }
      if (6 == id && (_tokenState & 1024 == 1024) && msg.sender == participants[2]) {
        _tokenState &= ~uint(1024);
        _tokenState |= 2048;
        break;
      }
      if (7 == id && (_tokenState & 2048 == 2048) && msg.sender == participants[3]) {
        _tokenState &= ~uint(2048);
        _tokenState |= 4096;
        break;
      }
      if (8 == id && (_tokenState & 4096 == 4096) && msg.sender == participants[4]) {
        _tokenState &= ~uint(4096);
        _tokenState |= 8192;
        break;
      }
      if (9 == id && (_tokenState & 8192 == 8192) && msg.sender == participants[4]) {
        _tokenState &= ~uint(8192);
        _tokenState |= 16384;
        break;
      }
      return;
    }

    while(_tokenState != 0) {
      if ((_tokenState & 16384 == 16384)) {
        _tokenState &= ~uint(16384);
        _tokenState |= 0;
        break; // is end
      }
      break;
    }

    tokenState = _tokenState;
  }
}