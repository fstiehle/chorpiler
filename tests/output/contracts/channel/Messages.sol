//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";

interface IChannelRoot {
  // TODO: Variable Packing
  // Registered State Channels
  struct Channel {
    bytes32 instanceID;
    address[] participants;
    address resolveContract;
  }

  // Submitted Proof
  struct Proof {
    bytes32 channelID;
    bytes[] signatures;
    bytes32 stateHash;
    bytes32 OP_RETURN;
  }

 /*
  Registers a new channel, its resolve contract address, and participating participants.
  */
  function register(Channel calldata _channel) external;
  function verify(Proof calldata _step) external returns (bool);
}

interface IProcessInstance {
  // State of a process instance (these change as the process progresses)
  struct InstanceState {
    uint tokenState;
    uint pizza_order;
    uint index; // state channel version index
  }

  // Encapsulating static instance data (need not to be signed)
  struct InstanceData {
    address[3] participants;
    InstanceState state;
    uint disputeMadeAtUNIX;
  }
}

interface IChannelResolver {
  // A step can be submitted to start a dispute or as final state
  struct Step {
    bytes32 intsanceID;
    IProcessInstance.InstanceState newState;
    bytes[] signatures;
    bytes32 OP_RETURN;
  }

  function enact(bytes32 _instanceID, uint id) external;
  function getTokenState(bytes32 _instanceID) external view returns (uint);
  function instance(uint _nonce, address[3] memory participants) external returns (bytes32);
  function submit(bytes32 _channelID, Step calldata _step) external;
}

IChannelRoot constant Channel_Root = IChannelRoot(0x5FbDB2315678afecb367f032d93F642f64180aa3);

contract Messages is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  mapping(bytes32 => IProcessInstance.InstanceData) public instanceData;
  event Task(uint id);
  

  function instance(uint _nonce, address[3] memory _participants) external returns (bytes32) {
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
      disputeMadeAtUNIX: 0,
      participants: _participants,
      state: IProcessInstance.InstanceState({
        index: 0,
        tokenState: 1,
        pizza_order: 0
      })
    });
    console.log("Messages: new instance registered with ID (see below)"); console.logBytes32(id);
    return id;
  }

  /**
   * Trigger new dispute or submit new state to elapse current dispute state
   * @param _step Last unanimously signed step, or empty step if process is stuck in start event
   */
   function submit(bytes32 _channelID, Step calldata _step) external {
    uint _disputeMadeAtUNIX = instanceData[_step.intsanceID].disputeMadeAtUNIX;
    if (0 == _step.newState.index && 0 == _disputeMadeAtUNIX) {
      // stuck in start event
      instanceData[_step.intsanceID].disputeMadeAtUNIX = block.timestamp;
      console.log("Messages: new dispute (stuck in start event) registered with channelID");
      console.logBytes32(_channelID);
    }
    else {
      if (checkStep(_channelID, _step)) {
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
        console.log("Messages: new dispute registered with channelID");
        console.logBytes32(_channelID);
      }
    }
  }

  function checkStep(bytes32 _channelID, Step calldata _step) private returns (bool) {
    // Check that step is higher than previously recorded steps
    if (instanceData[_step.intsanceID].state.index >= _step.newState.index) {
      return false;
    }

    return Channel_Root.verify(IChannelRoot.Proof({
      channelID: _channelID,
      signatures: _step.signatures,
      stateHash: keccak256(abi.encode(_step.newState)),
      OP_RETURN: _step.OP_RETURN
    }));
  }

  function getTokenState(bytes32 instanceID) external view returns (uint) {
    return instanceData[instanceID].state.tokenState;
  }

  function enact(bytes32 instanceID, uint id) public {
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
  
  function ChoreographyTask_0hy9n0g(bytes32 instanceID, uint _pizza_order) external {
    require(instanceData[instanceID].state.tokenState & 1 == 1);
    require(msg.sender == instanceData[instanceID].participants[0], "Invalid initiator");
  
    instanceData[instanceID].state.pizza_order = _pizza_order;
  
    console.log(
      "Set uint pizza_order to",
      _pizza_order
    );
    enact(instanceID, 1);
  }
  
  function ChoreographyTask_175oxwe(bytes32 instanceID, uint _pizza_order) external {
    require(instanceData[instanceID].state.tokenState & 4 == 4);
    require(msg.sender == instanceData[instanceID].participants[2], "Invalid initiator");
  
    instanceData[instanceID].state.pizza_order = _pizza_order;
  
    console.log(
      "Set uint pizza_order to",
      _pizza_order
    );
    enact(instanceID, 3);
  }
  
  function ChoreographyTask_1l3cbhv(bytes32 instanceID, uint _pizza_order) external {
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