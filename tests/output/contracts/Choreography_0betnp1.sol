//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessInstance {
  struct ProcessData {
    address[2] participants;
    uint tokenState;
  }
  function enact(uint instanceID, uint id) external;
  function getTokenState(uint instanceID) external view returns (uint);
  function instance(address[2] memory participants) external returns (uint);
}


contract Choreography_0betnp1 is IProcessInstance {
  mapping(uint => IProcessInstance.ProcessData) public processData;
  uint private nextId = 0;
  event Task(uint id);

  function instance(address[2] memory _participants) external returns (uint) {
    uint newId = nextId;
    processData[newId] = IProcessInstance.ProcessData({
      participants: _participants,
      tokenState: 1
    });
    nextId = newId + 1;
    return newId;
  }

  function getTokenState(uint instanceID) external view returns (uint) {
    return processData[instanceID].tokenState;
  }

  function enact(uint instanceID, uint id) external {
    uint _tokenState = processData[instanceID].tokenState;
    
    console.log(
      "Choreography_0betnp1: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_14yfpb3 New Activity --->
        if (1 == id && msg.sender == processData[instanceID].participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          emit Task(1);
          break; // is end
        }
      }
      break;
    }
    
    processData[instanceID].tokenState = _tokenState;
    
    console.log(
      "Choreography_0betnp1: new token state is %d",
       _tokenState
    );
  }
}
