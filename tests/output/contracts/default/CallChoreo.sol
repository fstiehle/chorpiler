//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";

interface IProcess {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}


interface IInstanceCall {
  function instance(uint nonce, address[] memory participants) external returns (bytes32);
  function enact(bytes32 instance, uint id) external;
  function getTokenState(bytes32 instance) external view returns (uint);
}

// Interface for Choreography_0betnp1
interface IChoreography_0betnp1 is IInstanceCall {
  function instance(uint nonce, address[2] memory participants) external returns (bytes32);
}
IChoreography_0betnp1 constant Choreography_0betnp1 = IChoreography_0betnp1(0x0000000000000000000000000000000000000000);

contract CallChoreo is IProcess {
  bytes32[1] private instanceList; // instanceIDs for calls
  uint private nextID; // nonce list for calls
  event NewInstance(uint id, bytes32 instanceID);
  uint private tokenState = 1;
  address[3] public participants;
  event Task(uint id);
  // Case Variable order
  uint private order = 0;
  

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function getTokenState() external view returns (uint) {
    return tokenState;
  }

  function enact(uint id) public {
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
        if (2 == id && msg.sender == participants[2] && 0 == Choreography_0betnp1.getTokenState(instanceList[0])) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(4);
          _tokenState |= 0;
          emit Task(2);
          break; // is end
        }
      }
      if (_tokenState & 2 == 2) {
        if (order == 1) {
          // <---  auto transition  --->
          _tokenState &= ~uint(2);
          instanceList[0] = Choreography_0betnp1.instance(nextID, [participants[0], participants[2]]);
          nextID = nextID + 1;
          emit NewInstance(0, instanceList[0]);
          _tokenState |= 4;
          continue;
        }
        else {
          // <---  auto transition  --->
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          continue;
        }
      }
      break;
    }
    
    tokenState = _tokenState;
    
    console.log(
      "CallChoreo: new token state is %d",
       _tokenState
    );
  }
  
  function ChoreographyTask_0hy9n0g(uint _order) external {
    require(tokenState & 1 == 1);
    require(msg.sender == participants[0], "Invalid initiator");
  
    order = _order;
  
    console.log(
      "Set uint order to",
      _order
    );
    enact(1);
  }

}
