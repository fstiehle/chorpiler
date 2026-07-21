//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcess {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}


contract Messages is IProcess {
  uint private tokenState = 1;
  address[3] public participants;
  event Task(uint id);
  // Case Variable pizza_order
  uint public pizza_order = 0;
  

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function getTokenState() external view returns (uint) {
    return tokenState;
  }

  function enact(uint id) public {
    uint _tokenState = tokenState;
    
    console.log(
      "Messages: current token state is %d, sender %s trying to execute task %d",
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
        if (pizza_order == 1) {
          // <--- ChoreographyTask_1l3cbhv New Activity --->
          if (4 == id && msg.sender == participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(4);
            _tokenState |= 0;
            emit Task(4);
            break; // is end
          }
        }
        else {
          // <--- ChoreographyTask_175oxwe deliver pizza --->
          if (3 == id && msg.sender == participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(4);
            _tokenState |= 0;
            emit Task(3);
            break; // is end
          }
        }
      }
      break;
    }
    
    tokenState = _tokenState;
    
    console.log(
      "Messages: new token state is %d",
       _tokenState
    );
  }
  
  function ChoreographyTask_0hy9n0g(uint _pizza_order) external {
    require(tokenState & 1 == 1);
    require(msg.sender == participants[0], "Invalid initiator");
  
    pizza_order = _pizza_order;
  
    console.log(
      "Set uint pizza_order to",
      _pizza_order
    );
      enact(1);
  }
  
  function ChoreographyTask_175oxwe(uint _pizza_order) external {
    require(tokenState & 4 == 4);
    require(msg.sender == participants[2], "Invalid initiator");
  
    pizza_order = _pizza_order;
  
    console.log(
      "Set uint pizza_order to",
      _pizza_order
    );
      enact(3);
  }
  
  function ChoreographyTask_1l3cbhv(uint _pizza_order) external {
    require(tokenState & 4 == 4);
    require(msg.sender == participants[2], "Invalid initiator");
  require(pizza_order == 1, "Decision condition not met");
  
    pizza_order = _pizza_order;
  
    console.log(
      "Set uint pizza_order to",
      _pizza_order
    );
      enact(4);
  }
}
