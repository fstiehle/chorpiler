//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";

interface IProcess {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}


contract RentalAgreement is IProcess {
  uint private tokenState = 1;
  address[3] public participants;
  event Task(uint id);
  // Case Variable conditions
  uint public conditions = 0;
  
  function setConditions(uint _conditions) external {
    conditions = _conditions;
  }

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function getTokenState() external view returns (uint) {
    return tokenState;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;
    
    console.log(
      "RentalAgreement: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    
    while(_tokenState != 0) {
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_19lvxvh pay bond --->
        if (1 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          emit Task(1);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_001w5ww file claim for bond --->
        if (2 == id && msg.sender == participants[2]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(8);
          _tokenState |= 16;
          emit Task(2);
          id = 0;
          continue;
        }
        // <--- ChoreographyTask_00l7an5 release bond --->
        if (6 == id && msg.sender == participants[2]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(8);
          _tokenState |= 64;
          emit Task(6);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- ChoreographyTask_1h13qrq file dispute --->
        if (3 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(16);
          _tokenState |= 0;
          emit Task(3);
          break; // is end
        }
        // <--- ChoreographyTask_0946is9 accept claim --->
        if (4 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(16);
          _tokenState |= 32;
          emit Task(4);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- ChoreographyTask_0235k4i transfer bond to landlord --->
        if (5 == id && msg.sender == participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(32);
          _tokenState |= 0;
          emit Task(5);
          break; // is end
        }
      }
      if (_tokenState & 64 == 64) {
        // <--- ChoreographyTask_07z22w1 refund bond to tenant --->
        if (7 == id && msg.sender == participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(64);
          _tokenState |= 0;
          emit Task(7);
          break; // is end
        }
      }
      if (_tokenState & 1 == 1) {
        if (conditions & 1 == 1) {
          // <---  auto transition  --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          break; // is end
        }
        else {
          // <---  auto transition  --->
          _tokenState &= ~uint(1);
          _tokenState |= 130;
          continue;
        }
      }
      if (_tokenState & 260 == 260) {
        // <---  auto transition  --->
        _tokenState &= ~uint(260);
        _tokenState |= 8;
        continue;
      }
      if (_tokenState & 128 == 128) {
        // <--- ChoreographyTask_1hddg8r pay rent --->
        if (8 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(128);
          _tokenState |= 128;
          emit Task(8);
          id = 0;
          continue;
        }
        // <--- ChoreographyTask_07y6gqp end tenancy --->
        if (9 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(128);
          _tokenState |= 256;
          emit Task(9);
          id = 0;
          continue;
        }
      }
      break;
    }
    
    tokenState = _tokenState;
    
    console.log(
      "RentalAgreement: new token state is %d",
       _tokenState
    );
  }

}
