//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract test_sid_e10a5cbc_c283_4709_86cd_d5009481692d {
  uint public tokenState = 1;
  address[24] public participants;
  uint public conditions;

  constructor(address[24] memory _participants) {
    participants = _participants;
  }
  function setConditions(uint _conditions) external {
    conditions = _conditions;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- sid-0EFDE292-9906-42C9-8EAB-CDF058111BBB &amp;#10;Estimate the delivery time &amp; Send order to the restaurant --->
        if (1 == id && msg.sender == participants[0]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- sid-A8332C86-E98E-440E-86D4-9E2BBBE9567B Analyze order --->
        if (2 == id && msg.sender == participants[2]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- sid-D2DB8983-A626-4B61-917B-66098B6C5D89 Estimate preparation time --->
        if (3 == id && msg.sender == participants[4]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8);
        _tokenState |= 48;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- sid-73C227DF-EA04-4F55-88DD-F61ECE7B8393 Send information about order being accepted by the restaurant --->
        if (4 == id && msg.sender == participants[6]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(16);
        _tokenState |= 64;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 384 == 384) {
        // <--- sid-A3112B50-18D1-4E72-9AF0-0282137C01BC Take order from the restaurant &amp; deliver it --->
        if (5 == id && msg.sender == participants[8]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(384);
        _tokenState |= 512;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 64 == 64) {
        // <--- sid-9F9CA66F-904C-4770-B4A8-96590468AD1C Ask to send the driver to the given address for the given time --->
        if (6 == id && msg.sender == participants[10]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(64);
        _tokenState |= 1024;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 1024 == 1024) {
        // <--- sid-6B593C04-B29E-4D98-99D9-EBBC9EA99E16 Driver arrives at the restaurant --->
        if (7 == id && msg.sender == participants[12]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1024);
        _tokenState |= 128;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 512 == 512) {
        // <--- sid-276CEC44-5600-4257-B6FC-03DAEAEB3ACF Receive order --->
        if (8 == id && msg.sender == participants[14]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(512);
        _tokenState |= 2048;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- sid-9DC65D38-A1A3-4DBC-B1FF-2AA7E8789EAE Prepare order --->
        if (9 == id && msg.sender == participants[16]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(32);
        _tokenState |= 256;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 2048 == 2048) {
        if (conditions & 2 == 2) {
          // <--- sid-8668ED69-4A2D-449D-8CAE-76CCB6FAD0CF Receive complaint --->
          if (11 == id && msg.sender == participants[20]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2048);
          _tokenState |= 4096;
          id = 0;
          continue; 
          }
        }
        else {
          // <--- sid-2C605F50-9CDC-4E7D-84F1-9DA1B55CF47B Receive feedback --->
          if (10 == id && msg.sender == participants[18]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2048);
          _tokenState |= 0;
          break; // is end
          }
        }
      }
      if (_tokenState & 4096 == 4096) {
        if (conditions & 4 == 4) {
          // <---  auto transition  --->
          _tokenState &= ~uint(4096);
          _tokenState |= 8;
          continue; 
        }
        else {
          // <--- sid-D796B62F-F6F4-4005-9B9A-4EACC480AF78 Complaint rejected --->
          if (12 == id && msg.sender == participants[22]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(4096);
          _tokenState |= 0;
          break; // is end
          }
        }
      }
      if (_tokenState & 4 == 4) {
        if (conditions & 1 == 1) {
          // <---  auto transition  --->
          _tokenState &= ~uint(4);
          _tokenState |= 8;
          continue; 
        }
        else {
          // <---  auto transition  --->
          _tokenState &= ~uint(4);
          _tokenState |= 0;
          break; // is end
        }
      }
      break;
    }

    tokenState = _tokenState;
  }

}