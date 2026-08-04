//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";

interface IChannelRoot {

  // TODO: Variable Packing
  struct Channel {
    uint instanceID;
    address[] participants;
    address resolveContract;
  }

  struct Proof {
    bytes[] signatures;
    bytes32 stateHash;
    bytes32 OP_RETURN;
  }

 /*
  Registers a new channel, its resolve contract address, and participating participants.
  */
  function register(Channel calldata _channel) external;
  function verify(bytes32 _id, Proof calldata _step) external returns (bool);
}

interface IProcessInstance {

  struct InstanceState {
    uint tokenState;
    uint pizza_order;

    // state channel version index
    uint index;
  }

  struct InstanceData {
    address[3] participants;
    InstanceState state;
    /// Timestamps for the challenge-response dispute window
    uint disputeMadeAtUNIX;
  }
}

interface IChannelResolver {
  struct Step {
    uint index;
    uint intsanceID;
    IProcessInstance.InstanceState newState;
    bytes[] signatures;
    bytes32 OP_RETURN;
  }

  function enact(uint instanceID, uint id) external;
  function getTokenState(uint instanceID) external view returns (uint);
  function instance(address[3] memory participants) external returns (uint);
  function submit(bytes32 id, Step calldata _step) external;
}


IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

contract ChannelResolverMessages is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  mapping(uint => IProcessInstance.InstanceData) public instanceData;
  uint private nextId = 0;
  event Task(uint id);
  // Case Variable pizza_order
  

  function instance(address[3] memory _participants) external returns (uint) {
    uint newId = nextId;
    instanceData[newId] = IProcessInstance.InstanceData({
      disputeMadeAtUNIX: 0,
      participants: _participants,
      state: IProcessInstance.InstanceState({
        index: 0,
        tokenState: 1,
        pizza_order: 0
      })
    });
    nextId = newId + 1;
    return newId;
  }

  /**
   * Trigger new dispute or submit new state to elapse current dispute state
   * @param _step Last unanimously signed step, or empty step if process is stuck in start event
   */
   function submit(bytes32 id, Step calldata _step) external {
    uint _disputeMadeAtUNIX = instanceData[_step.intsanceID].disputeMadeAtUNIX;
    if (0 == _step.index && 0 == _disputeMadeAtUNIX) {
      // stuck in start event
      instanceData[_step.intsanceID].disputeMadeAtUNIX = block.timestamp;
    }
    else {
      if (checkStep(id, _step)) {
        if (0 == _disputeMadeAtUNIX) {
          // new dispute or final state
          if (_step.newState.tokenState != 0) {
            // new dispute with state submission
            instanceData[_step.intsanceID].disputeMadeAtUNIX = block.timestamp;
          }
          instanceData[_step.intsanceID].state = _step.newState;
        } else if (_disputeMadeAtUNIX + disputeWindowInUNIX >= block.timestamp) {
          // submission to existing dispute
          instanceData[_step.intsanceID].state = _step.newState;
        }
      }
    }
  }

  function checkStep(bytes32 id, Step calldata _step) private returns (bool) {
    // Check that step is higher than previously recorded steps
    if (instanceData[_step.intsanceID].state.index >= _step.index) {
      return false;
    }

    return Channel_Root.verify(id, IChannelRoot.Proof({
      signatures: _step.signatures,
      stateHash: keccak256(abi.encode(_step.newState)),
      OP_RETURN: _step.OP_RETURN
    }));
  }

  function getTokenState(uint instanceID) external view returns (uint) {
    return instanceData[instanceID].state.tokenState;
  }

  function enact(uint instanceID, uint id) public {
    uint _disputeMadeAtUNIX = instanceData[instanceID].disputeMadeAtUNIX;
    require(_disputeMadeAtUNIX != 0 && _disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp, "No elapsed dispute");
    
    uint _tokenState = instanceData[instanceID].state.tokenState;
    
    console.log(
      "Messages: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0hy9n0g order pizza --->
        if (1 == id && msg.sender == instanceData[instanceID].participants[0]) {
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
        if (2 == id && msg.sender == instanceData[instanceID].participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          emit Task(2);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 4 == 4) {
        if (instanceData[instanceID].state.pizza_order == 1) {
          // <--- ChoreographyTask_1l3cbhv New Activity --->
          if (4 == id && msg.sender == instanceData[instanceID].participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(4);
            _tokenState |= 0;
            emit Task(4);
            break; // is end
          }
        }
        else {
          // <--- ChoreographyTask_175oxwe deliver pizza --->
          if (3 == id && msg.sender == instanceData[instanceID].participants[2]) {
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
    
    instanceData[instanceID].state.tokenState = _tokenState;
    
    console.log(
      "Messages: new token state is %d",
       _tokenState
    );
  }
  
  function ChoreographyTask_0hy9n0g(uint instanceID, uint _pizza_order) external {
    require(instanceData[instanceID].state.tokenState & 1 == 1);
    require(msg.sender == instanceData[instanceID].participants[0], "Invalid initiator");
  
    instanceData[instanceID].state.pizza_order = _pizza_order;
  
    console.log(
      "Set uint pizza_order to",
      _pizza_order
    );
      enact(instanceID, 1);
  }
  
  function ChoreographyTask_175oxwe(uint instanceID, uint _pizza_order) external {
    require(instanceData[instanceID].state.tokenState & 4 == 4);
    require(msg.sender == instanceData[instanceID].participants[2], "Invalid initiator");
  
    instanceData[instanceID].state.pizza_order = _pizza_order;
  
    console.log(
      "Set uint pizza_order to",
      _pizza_order
    );
      enact(instanceID, 3);
  }
  
  function ChoreographyTask_1l3cbhv(uint instanceID, uint _pizza_order) external {
    require(instanceData[instanceID].state.tokenState & 4 == 4);
    require(msg.sender == instanceData[instanceID].participants[2], "Invalid initiator");
  require(instanceData[instanceID].state.pizza_order == 1, "Decision condition not met");
  
    instanceData[instanceID].state.pizza_order = _pizza_order;
  
    console.log(
      "Set uint pizza_order to",
      _pizza_order
    );
      enact(instanceID, 4);
  }
}