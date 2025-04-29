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
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_0lvyk79 Give prescription --->
        if ( 
        1 == id
        && 
        msg.sender == participants[3]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_1eeg831 Give medication --->
        if ( 
        2 == id
        && 
        msg.sender == participants[4]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8);
        _tokenState |= 0;
        break; // is end
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_0hi5qrq Order medication --->
        if ( 
        3 == id
        && 
        msg.sender == participants[4]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 16;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_1mgomgq Write prescription --->
        if ( 
        4 == id
        && 
        msg.sender == participants[0]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- ChoreographyTask_0qvwzvz Deliver medication --->
        if ( 
        5 == id
        && 
        msg.sender == participants[1]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(32);
        _tokenState |= 64;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 64 == 64) {
        // <--- ChoreographyTask_1gwk89f Notify that maedication arrived --->
        if ( 
        6 == id
        && 
        msg.sender == participants[4]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(64);
        _tokenState |= 8;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- ChoreographyTask_0gppzdf Medication created --->
        if ( 
        7 == id
        && 
        msg.sender == participants[2]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(16);
        _tokenState |= 32;
        id = 0;
        continue; 
        }
      }
      break;
    }

    tokenState = _tokenState;
  }

}