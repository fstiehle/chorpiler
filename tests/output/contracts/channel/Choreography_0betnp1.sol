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
  function verify(Proof calldata _step) external view returns (bool);
}

interface IProcessInstance {
  // State of a process instance (these change as the process progresses)
  struct InstanceState {
    uint tokenState;
    uint order;
    uint index; // state channel version index
  }

  // Encapsulating static instance data (need not to be signed)
  struct InstanceData {
    address[2] participants;
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
  function instance(uint _nonce, address[2] memory participants) external returns (bytes32);
  function submit(bytes32 _channelID, Step calldata _step) external;
}

IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

contract Choreography_0betnp1 is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

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
      disputeMadeAtUNIX: 0,
      participants: _participants,
      state: IProcessInstance.InstanceState({
        index: 0,
        tokenState: 1,
        order: 0
      })
    });
    console.log("Choreography_0betnp1: new instance registered with ID (see below)"); console.logBytes32(id);
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
      console.log("Choreography_0betnp1: new dispute (stuck in start event) registered with channelID");
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
        console.log("Choreography_0betnp1: new dispute registered with channelID");
        console.logBytes32(_channelID);
      }
    }
  }

  function checkStep(bytes32 _channelID, Step calldata _step) private view returns (bool) {
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

  function enact(bytes32 instanceID, uint id) external {
    uint _disputeMadeAtUNIX = instanceData[instanceID].disputeMadeAtUNIX;
    require(_disputeMadeAtUNIX != 0 && _disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp, "No elapsed dispute");
    
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