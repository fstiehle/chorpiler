//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessExecution {
  function enact(uint id) external;
}

contract SubChoreo is IProcessExecution {
  uint[2] public tokenState;
  address[3] public participants;
  event Task(uint id);

  constructor(address[3] memory _participants) {
    participants = _participants;
    tokenState[0] = 1;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState[0];

    console.log(
      "SubChoreo: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0hy9n0g Start Task --->
        if (1 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 6;
          emit Task(1);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_0agkzua GatewayTask --->
        if (2 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 8;
          emit Task(2);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 24 == 24) {
        // <--- ChoreographyTask_0yky73k End Task --->
        if (3 == id && 0 == tokenState[1] && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(24);
          _tokenState |= 0;
          emit Task(3);
          break; // is end
        }
      }
      if (_tokenState & 4 == 4) {
        // <---  auto transition  --->
        _tokenState &= ~uint(4);
        tokenState[1] = 1;
        _tokenState |= 16;
        continue;
      }
      break;
    }

    tokenState[0] = _tokenState;
    console.log(
      "SubChoreo: new token state is %d",
       _tokenState
    );
  }

  function SubChoreography_1bsql62(uint id) external {
    uint _tokenState = tokenState[1];

    console.log(
      "SubChoreography_1bsql62: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0tcvdg0 SubTask --->
        if (1 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          emit Task(1);
          break; // is end
        }
      }
      break;
    }

    tokenState[1] = _tokenState;
    console.log(
      "SubChoreography_1bsql62: new token state is %d",
       _tokenState
    );
  }

}
