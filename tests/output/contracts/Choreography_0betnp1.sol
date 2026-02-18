//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessExecution {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}

contract Choreography_0betnp1 is IProcessExecution {
  uint private tokenState = 1;
  address[2] public participants;
  event Task(uint id);

  constructor(
    address[2] memory _participants
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
      "Choreography_0betnp1: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_14yfpb3 New Activity --->
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

    tokenState = _tokenState;
    console.log(
      "Choreography_0betnp1: new token state is %d",
       _tokenState
    );
  }

}
