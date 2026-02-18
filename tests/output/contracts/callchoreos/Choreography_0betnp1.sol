//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IInstanceExecution {
  struct ProcessData {
    address[2] participants;
    uint tokenState;
  }
  function enact(uint instance, uint id) external;
  function getTokenState(uint instance) external view returns (uint);
  function instance(address[2] memory participants) external returns (uint);
}

contract Choreography_0betnp1 is IInstanceExecution {
  mapping(uint => IInstanceExecution.ProcessData) public processData;
  uint private nextId = 0;
  event Task(uint id);

  function instance(address[2] memory _participants) external returns (uint) {
    uint newId = nextId;
    processData[newId] = IInstanceExecution.ProcessData({
      participants: _participants,
      tokenState: 1;
    });
    return newId;
  }

  function getTokenState(uint instance) external view returns (uint) {
    return processData[instance].tokenState;
  }

  function enact(uint instance, uint id) external {
    uint _tokenState = processData[instance].tokenState;

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

    processData[instance].tokenState = _tokenState;;
    console.log(
      "Choreography_0betnp1: new token state is %d",
       _tokenState
    );
  }

}
