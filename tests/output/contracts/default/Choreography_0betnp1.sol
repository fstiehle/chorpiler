//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";

interface IProcessInstance {
  struct InstanceState {
    uint tokenState;
    uint order;
  }
  struct InstanceData {
    address[2] participants;
    InstanceState state;
  }
  function enact(bytes32 instanceID, uint id) external;
  function getTokenState(bytes32 instanceID) external view returns (uint);
  function instance(uint nonce, address[2] memory participants) external returns (bytes32);
}


contract Choreography_0betnp1 is IProcessInstance {
  mapping(bytes32 => IProcessInstance.InstanceData) public instanceData;
  event Task(uint id);
  

  function instance(uint _nonce, address[2] memory _participants) external returns (bytes32) {
    bytes32 id = keccak256(
      abi.encode(
        _nonce,
        _participants
      )
    );
    // write to channel if id doesn't exist yet
    require(
      instanceData[id].state.tokenState == 0,
      "instance already exists"
    );
    instanceData[id] = IProcessInstance.InstanceData({
      participants: _participants,
      state: IProcessInstance.InstanceState({
        tokenState: 1,
        order: 0
      })
    });
    console.log("Choreography_0betnp1: new instance registered with ID (see below)"); console.logBytes32(id);
    return id;
  }

  function getTokenState(bytes32 instanceID) external view returns (uint) {
    return instanceData[instanceID].state.tokenState;
  }

  function enact(bytes32 instanceID, uint id) external {
    uint _tokenState = instanceData[instanceID].state.tokenState;
    
    console.log(
      "Choreography_0betnp1: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_14yfpb3 New Activity --->
        if (1 == id && msg.sender == instanceData[instanceID].participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          emit Task(1);
          break; // is end
        }
      }
      break;
    }
    
    instanceData[instanceID].state.tokenState = _tokenState;
    
    console.log(
      "Choreography_0betnp1: new token state is %d",
       _tokenState
    );
  }

}
