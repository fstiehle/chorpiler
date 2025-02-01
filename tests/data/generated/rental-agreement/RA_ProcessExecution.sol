//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract RA_ProcessExecution {
  uint public tokenState = 1;
  address[3] public participants;
  int public bond = 2500;
  int public weeklyRent = 0;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function setbond(int _bond) external {
    bond = _bond;
  }
  function setweeklyRent(int _weeklyRent) external {
    weeklyRent = _weeklyRent;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;
    
    while(_tokenState != 0) {
      if ((_tokenState & 1 == 1)) {
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        continue;
      }
      if (((bond > 4 * weeklyRent)) && (_tokenState & 2 == 2)) {
        _tokenState &= ~uint(2);
        _tokenState |= 128;
        continue;
      }
      if ((_tokenState & 2 == 2)) {
        _tokenState &= ~uint(2);
        _tokenState |= 4096;
        continue;
      }
      if (1 == id && (_tokenState & 8192 == 8192)) {
        _tokenState &= ~uint(8192);
        _tokenState |= 16;
        continue;
      }
      if (5 == id && (_tokenState & 8192 == 8192)) {
        _tokenState &= ~uint(8192);
        _tokenState |= 1024;
        continue;
      }
      if (2 == id && (_tokenState & 32 == 32)) {
        _tokenState &= ~uint(32);
        _tokenState |= 64;
        continue;
      }
      if (3 == id && (_tokenState & 32 == 32)) {
        _tokenState &= ~uint(32);
        _tokenState |= 256;
        continue;
      }
      if ((_tokenState & 4096 == 4096)) {
        _tokenState &= ~uint(4096);
        _tokenState |= 16388;
        continue;
      }
      if ((_tokenState & 32776 == 32776)) {
        _tokenState &= ~uint(32776);
        _tokenState |= 8192;
        continue;
      }
      if ((_tokenState & 16384 == 16384)) {
        _tokenState &= ~uint(16384);
        _tokenState |= 65536;
        continue;
      }
      if ((_tokenState & 65536 == 65536)) {
        _tokenState &= ~uint(65536);
        _tokenState |= 2097152;
        continue;
      }
      if ((_tokenState & 262144 == 262144)) {
        _tokenState &= ~uint(262144);
        _tokenState |= 2097152;
        continue;
      }
      if (7 == id && (_tokenState & 2097152 == 2097152)) {
        _tokenState &= ~uint(2097152);
        _tokenState |= 131072;
        continue;
      }
      if (8 == id && (_tokenState & 2097152 == 2097152)) {
        _tokenState &= ~uint(2097152);
        _tokenState |= 524288;
        continue;
      }
      if ((_tokenState & 1 == 1)) {
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        continue;
      }
      if ((_tokenState & 2 == 2)) {
        _tokenState &= ~uint(2);
        _tokenState |= 4096;
        continue;
      }
      if ((_tokenState & 8192 == 8192)) {
        _tokenState &= ~uint(8192);
        _tokenState |= 16;
        continue;
      }
      if ((_tokenState & 8192 == 8192)) {
        _tokenState &= ~uint(8192);
        _tokenState |= 1024;
        continue;
      }
      if ((_tokenState & 32 == 32)) {
        _tokenState &= ~uint(32);
        _tokenState |= 64;
        continue;
      }
      if ((_tokenState & 32 == 32)) {
        _tokenState &= ~uint(32);
        _tokenState |= 256;
        continue;
      }
      if ((_tokenState & 4096 == 4096)) {
        _tokenState &= ~uint(4096);
        _tokenState |= 16388;
        continue;
      }
      if ((_tokenState & 32776 == 32776)) {
        _tokenState &= ~uint(32776);
        _tokenState |= 8192;
        continue;
      }
      if ((_tokenState & 16384 == 16384)) {
        _tokenState &= ~uint(16384);
        _tokenState |= 65536;
        continue;
      }
      if ((_tokenState & 65536 == 65536)) {
        _tokenState &= ~uint(65536);
        _tokenState |= 2097152;
        continue;
      }
      if ((_tokenState & 262144 == 262144)) {
        _tokenState &= ~uint(262144);
        _tokenState |= 2097152;
        continue;
      }
      if ((_tokenState & 2097152 == 2097152)) {
        _tokenState &= ~uint(2097152);
        _tokenState |= 131072;
        continue;
      }
      if ((_tokenState & 2097152 == 2097152)) {
        _tokenState &= ~uint(2097152);
        _tokenState |= 524288;
        continue;
      }
      break;
    }

    while(_tokenState != 0) {
      if (0 == id && (_tokenState & 4 == 4) && msg.sender == participants[0]) {
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        break;
      }
      if (1 == id && (_tokenState & 16 == 16) && msg.sender == participants[2]) {
        _tokenState &= ~uint(16);
        _tokenState |= 32;
        break;
      }
      if (2 == id && (_tokenState & 64 == 64) && msg.sender == participants[0]) {
        _tokenState &= ~uint(64);
        _tokenState |= 128;
        break;
      }
      if (3 == id && (_tokenState & 256 == 256) && msg.sender == participants[0]) {
        _tokenState &= ~uint(256);
        _tokenState |= 512;
        break;
      }
      if (4 == id && (_tokenState & 512 == 512) && msg.sender == participants[1]) {
        _tokenState &= ~uint(512);
        _tokenState |= 128;
        break;
      }
      if (5 == id && (_tokenState & 1024 == 1024) && msg.sender == participants[2]) {
        _tokenState &= ~uint(1024);
        _tokenState |= 2048;
        break;
      }
      if (6 == id && (_tokenState & 2048 == 2048) && msg.sender == participants[1]) {
        _tokenState &= ~uint(2048);
        _tokenState |= 128;
        break;
      }
      if (7 == id && (_tokenState & 131072 == 131072) && msg.sender == participants[0]) {
        _tokenState &= ~uint(131072);
        _tokenState |= 262144;
        break;
      }
      if (8 == id && (_tokenState & 524288 == 524288) && msg.sender == participants[0]) {
        _tokenState &= ~uint(524288);
        _tokenState |= 1048576;
        break;
      }
      return;
    }

    while(_tokenState != 0) {
      if ((_tokenState & 128 == 128)) {
        _tokenState &= ~uint(128);
        _tokenState |= 0;
        break; // is end
      }
      if ((_tokenState & 1048576 == 1048576)) {
        _tokenState &= ~uint(1048576);
        _tokenState |= 65536;
        continue;
      }
      break;
    }

    tokenState = _tokenState;
  }
}