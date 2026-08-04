//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";

interface IProcess {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}

interface IInstanceCall {
  function instance(address[] memory participants) external returns (uint);
  function enact(uint instance, uint id) external;
  function getTokenState(uint instance) external view returns (uint);
}

// Interface for Choreography_0betnp1
interface IChoreography_0betnp1 is IInstanceCall {
  function instance(address[2] memory participants) external returns (uint);
}
IChoreography_0betnp1 constant Choreography_0betnp1 = IChoreography_0betnp1(0x0000000000000000000000000000000000000000);

// Interface for Choreography_1661x4r
interface IChoreography_1661x4r is IInstanceCall {
  function instance(address[2] memory participants) external returns (uint);
}
IChoreography_1661x4r constant Choreography_1661x4r = IChoreography_1661x4r(0x0000000000000000000000000000000000000000);

contract CallChoreoChained is IProcess {
  uint[2] private instanceList; // instanceIDs for calls
  event NewInstance(uint id, uint instanceID);
  uint private tokenState = 1;
  address[3] public participants;
  event Task(uint id);

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function getTokenState() external view returns (uint) {
    return tokenState;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;
    
    console.log(
      "CallChoreoChained: current token state is %d, sender %s trying to execute task %d",
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
        // <---  auto transition  --->
        _tokenState &= ~uint(2);
        instanceList[0] = Choreography_0betnp1.instance([participants[0], participants[2]]);
        emit NewInstance(0, instanceList[0]);
        _tokenState |= 4;
        continue;
      }
      if (_tokenState & 4 == 4) {
        // <---  auto transition  --->
        if (0 == Choreography_0betnp1.getTokenState(instanceList[0])) {
          _tokenState &= ~uint(4);
          instanceList[1] = Choreography_1661x4r.instance([participants[0], participants[1]]);
          emit NewInstance(1, instanceList[1]);
          _tokenState |= 0;
          break; // is end
        }
      }
      break;
    }
    
    tokenState = _tokenState;
    
    console.log(
      "CallChoreoChained: new token state is %d",
       _tokenState
    );
  }

}
