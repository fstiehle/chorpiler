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
  // State of a process instance (these change as the process progresses)
  struct InstanceState {
    uint tokenState;
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

  function enact(bytes32 instanceID, uint id) external;
  function getTokenState(bytes32 instanceID) external view returns (uint);
  function instance(uint _nonce, address[3] memory participants) external returns (bytes32);
  function submit(bytes32 id, Step calldata _step) external;
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

// Interface for Choreography_1661x4r
interface IChoreography_1661x4r is IInstanceCall {
  function instance(uint nonce, address[2] memory participants) external returns (bytes32);
}
IChoreography_1661x4r constant Choreography_1661x4r = IChoreography_1661x4r(0x0000000000000000000000000000000000000000);

IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

contract CallChoreoChained is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  bytes32[2] private instanceList; // instanceIDs for calls
  uint private nextID; // nonce list for calls
  event NewInstance(uint id, bytes32 instanceID);
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
        tokenState: 1    })
    });
    console.log("CallChoreoChained: new instance registered with ID (see below)"); console.logBytes32(id);
    return id;
  }

  /**
   * Trigger new dispute or submit new state to elapse current dispute state
   * @param _step Last unanimously signed step, or empty step if process is stuck in start event
   */
   function submit(bytes32 id, Step calldata _step) external {
    uint _disputeMadeAtUNIX = instanceData[_step.intsanceID].disputeMadeAtUNIX;
    if (0 == _step.newState.index && 0 == _disputeMadeAtUNIX) {
      // stuck in start event
      instanceData[_step.intsanceID].disputeMadeAtUNIX = block.timestamp;
      console.log("CallChoreoChained: new dispute (stuck in start event) registered with ID (see below)"); console.logBytes32(id);
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
        console.log("CallChoreoChained: new dispute registered with ID (see below)"); console.logBytes32(id);
      }
    }
  }

  function checkStep(bytes32 id, Step calldata _step) private returns (bool) {
    // Check that step is higher than previously recorded steps
    if (instanceData[_step.intsanceID].state.index >= _step.newState.index) {
      return false;
    }

    return Channel_Root.verify(id, IChannelRoot.Proof({
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
      "CallChoreoChained: current token state is %d, sender %s trying to execute task %d",
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
        // <---  auto transition  --->
        _tokenState &= ~uint(2);
        instanceList[0] = Choreography_0betnp1.instance(nextID, [instanceData[instanceID].participants[0], instanceData[instanceID].participants[2]]);
        nextID = nextID + 1;
        emit NewInstance(0, instanceList[0]);
        _tokenState |= 4;
        continue;
      }
      if (_tokenState & 4 == 4) {
        // <---  auto transition  --->
        if (0 == Choreography_0betnp1.getTokenState(instanceList[0])) {
          _tokenState &= ~uint(4);
          instanceList[1] = Choreography_1661x4r.instance(nextID, [instanceData[instanceID].participants[0], instanceData[instanceID].participants[1]]);
          nextID = nextID + 1;
          emit NewInstance(1, instanceList[1]);
          _tokenState |= 0;
          break; // is end
        }
      }
      break;
    }
    
    instanceData[instanceID].state.tokenState = _tokenState;
    
    console.log(
      "CallChoreoChained: new token state is %d",
       _tokenState
    );
  }

}