//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessExecution {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}

contract Messages is IProcessExecution {
  uint private tokenState = 1;
  address[3] public participants;
  event Task(uint id);

  // Case Variable pizza_order
  string public pizza_order = ""

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function getTokenState() external view returns (uint) {
    return tokenState;
  }

  function ChoreographyTask_0hy9n0g(string _pizza_order) external {
    require(tokenState & 1 == 1);
    require(msg.sender == participants[0], "Invalid initiator");

    pizza_order = _pizza_order;
    tokenState = 2;
    if (tokenState != 0) {
      enact(0);
    }
  }

  function ChoreographyTask_175oxwe(string _pizza_order) external {
    require(tokenState & 4 == 4);
    require(msg.sender == participants[2], "Invalid initiator");

    pizza_order = _pizza_order;
    tokenState = 0;
    if (tokenState != 0) {
      enact(0);
    }
  }

  function ChoreographyTask_1l3cbhv(string _pizza_order) external {
    require(tokenState & 4 == 4);
    require(msg.sender == participants[2], "Invalid initiator");
require(pizza_order == "tuna", "Decision condition not met");

    pizza_order = _pizza_order;
    tokenState = 0;
    if (tokenState != 0) {
      enact(0);
    }
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;
    console.log(
      "Messages: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
      }
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_1m3qduh hand over pizza --->
        if (2 == id && msg.sender == participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          emit Task(2);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 4 == 4) {
      }
      break;
    }
    
    tokenState = _tokenState;
    
    console.log(
      "Messages: new token state is %d",
       _tokenState
    );
  }

}
