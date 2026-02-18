//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessExecution {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}

interface ICalledProcessExecution {
  function instance(address[] memory participants) external returns (uint);
  function enact(uint instance, uint id) external;
  function getTokenState(uint instance) external view returns (uint);
}

contract CallChoreo is IProcessExecution {
  uint[1] private callList; // instance
  uint private tokenState = 1;
  address[3] public participants;
  event Task(uint id);

  constructor(
    address[3] memory _participants,
    address[1] memory _callList
  ) {
    participants = _participants;
    callList = _callList;
  }

  function getTokenState() external view returns (uint) {
    return tokenState;
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
        if (2 == id && msg.sender == participants[2] && 0 == ICalledProcessExecution(callList[Choreography_0betnp1]).tokenState()) {
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
        callList[0].instance = callList[0].contract.instance([participants[0], participants[1]]);
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
