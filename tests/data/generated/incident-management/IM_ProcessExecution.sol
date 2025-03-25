//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract IM_ProcessExecution {
  uint public tokenState = 1;
  address[5] public participants;
  bool public resolved = false;

  constructor(address[5] memory _participants) {
    participants = _participants;
  }
  function setresolved(bool _resolved) external {
    resolved = _resolved;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_1586fdc Customer Has a Problem --->
        if ( 
        1 == id
        && 
        msg.sender == participants[0]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        _tokenState |= 2;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_1y1xlzg Get problem description --->
        if ( 
        2 == id
        && 
        msg.sender == participants[1]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        _tokenState |= 4;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_0uo8k5k Explain solution --->
        if ( 
        3 == id
        && 
        msg.sender == participants[1]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8);
        _tokenState |= 0;
        _tokenState |= 0;
        id = 0;
        break; // is end
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_0z1rm3g Ask 1st level support --->
        if ( 
        4 == id
        && 
        msg.sender == participants[1]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 16;
        _tokenState |= 16;
        id = 0;
        continue; 
        }
        // <---  auto transition  --->
        if ( 
        (resolved==true)
        ) {
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        _tokenState |= 8;
        continue; 
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- ChoreographyTask_1qccz6z Provide feedback --->
        if ( 
        5 == id
        && 
        msg.sender == participants[2]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(32);
        _tokenState |= 8;
        _tokenState |= 8;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- ChoreographyTask_1qslyew Ask 2nd level support --->
        if ( 
        6 == id
        && 
        msg.sender == participants[2]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(16);
        _tokenState |= 64;
        _tokenState |= 64;
        id = 0;
        continue; 
        }
        // <---  auto transition  --->
        if ( 
        (resolved==true)
        ) {
        _tokenState &= ~uint(16);
        _tokenState |= 32;
        _tokenState |= 32;
        continue; 
        }
      }
      if (_tokenState & 64 == 64) {
        // <--- ChoreographyTask_15fmbmw Ask developer --->
        if ( 
        7 == id
        && 
        msg.sender == participants[3]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(64);
        _tokenState |= 128;
        _tokenState |= 128;
        id = 0;
        continue; 
        }
        // <---  auto transition  --->
        if ( 
        (resolved==true)
        ) {
        _tokenState &= ~uint(64);
        _tokenState |= 256;
        _tokenState |= 256;
        continue; 
        }
      }
      if (_tokenState & 128 == 128) {
        // <--- ChoreographyTask_15tec1l Provide feedback --->
        if ( 
        8 == id
        && 
        msg.sender == participants[4]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(128);
        _tokenState |= 256;
        _tokenState |= 256;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 256 == 256) {
        // <--- ChoreographyTask_1ecmkkd Provide feedback --->
        if ( 
        9 == id
        && 
        msg.sender == participants[3]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(256);
        _tokenState |= 32;
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