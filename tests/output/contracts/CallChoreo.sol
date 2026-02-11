//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessExecution {
  function enact(uint id) external;
  function tokenState() external returns (uint);
}

interface ICalledProcessExecution is IProcessExecution {
  function initiate() external;
}

contract CallChoreo is IProcessExecution {
  uint public tokenState = 1;
  address[1] private callList;
  address[3] public participants;
  event Task(uint id);

  constructor(
    address[3] memory _participants,
    address[1] memory _callList
  ) {
    participants = _participants;
    callList = _callList;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    console.log(
      "CallChoreo: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0hy9n0g order pizza --->
        if (1 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          emit Task(1);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_175oxwe deliver pizza --->
        if (2 == id && msg.sender == participants[2] && 0 == ICalledProcessExecution(callList[0]).tokenState()) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(4);
          _tokenState |= 0;
          emit Task(2);
          break; // is end
        }
      }
      if (_tokenState & 2 == 2) {
        // <---  auto transition  --->
        _tokenState &= ~uint(2);
        ICalledProcessExecution(callList[0]).initiate();
        _tokenState |= 4;
        continue;
      }
      break;
    }

    tokenState = _tokenState;
    console.log(
      "CallChoreo: new token state is %d",
       _tokenState
    );
  }

}
