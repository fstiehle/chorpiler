//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract test_sid_21aac2de_d691_4d66_8b8f_709c14cb84c4 {
  uint public tokenState = 1;
  address[12] public participants;
  uint public conditions;

  constructor(address[12] memory _participants) {
    participants = _participants;
  }
  function setConditions(uint _conditions) external {
    conditions = _conditions;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- sid-06D8F2D0-6BD1-4AF1-B057-F2BDF456D669 Änderung senden&amp;#10; --->
        if (1 == id && msg.sender == participants[0]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 6;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- sid-A06E9F8A-1AFE-44B0-B216-2031CB8BE358 Vorschlag bearbeiten&amp;#10; --->
        if (2 == id && msg.sender == participants[3]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 8;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- sid-03DBAEBA-74CD-4B04-BD71-F56E32E84F02 Vorschlag bearbeiten&amp;#10; --->
        if (3 == id && msg.sender == participants[5]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 16;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 32 == 32) {
        if (conditions & 1 == 1) {
          // <---  auto transition  --->
          _tokenState &= ~uint(32);
          _tokenState |= 0;
          break; // is end
        }
        else {
          // <--- sid-24729521-9EAE-4157-8A7A-D2C60B7B8FF7 Verhandlung über Meeting&amp;#10; --->
          if (4 == id && msg.sender == participants[7]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(32);
          _tokenState |= 64;
          id = 0;
          continue; 
          }
        }
      }
      if (_tokenState & 64 == 64) {
        if (conditions & 2 == 2) {
          // <--- sid-F8A4FB9C-08D5-433D-8DA5-4990DE96F98E Geschäftsführer informieren&amp;#10; --->
          if (5 == id && msg.sender == participants[10]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(64);
          _tokenState |= 0;
          break; // is end
          }
        }
        else {
          // <---  auto transition  --->
          _tokenState &= ~uint(64);
          _tokenState |= 0;
          break; // is end
        }
      }
      if (_tokenState & 24 == 24) {
        // <---  auto transition  --->
        _tokenState &= ~uint(24);
        _tokenState |= 32;
        continue; 
      }
      break;
    }

    tokenState = _tokenState;
  }

}