//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";

interface IChannelRoot {
  // TODO: Variable Packing
  // Registered State Channels
  struct Channel {
    uint instanceID;
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

IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

contract ChannelResolverCallChoreoChained is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  uint[2] private instanceList; // instanceIDs for calls
  event NewInstance(uint id, uint instanceID);
  mapping(uint => IProcessInstance.InstanceData) public instanceData;
  uint private nextId = 0;
  event Task(uint id);

  function instance(address[3] memory _participants) external returns (uint) {
    uint newId = nextId;
    instanceData[newId] = IProcessInstance.InstanceData({
      disputeMadeAtUNIX: 0,
      participants: _participants,
      state: IProcessInstance.InstanceState({
        index: 0,
        tokenState: 1    })
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

  function enact(uint instanceID, uint id) external {
    uint _disputeMadeAtUNIX = instanceData[instanceID].disputeMadeAtUNIX;
    require(_disputeMadeAtUNIX != 0 && _disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp, "No elapsed dispute");
    
    uint _tokenState = instanceData[instanceID].state.tokenState;
    
    console.log(
      "ChannelResolverCallChoreoChained: current token state is %d, sender %s trying to execute task %d",
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
        instanceList[0] = Choreography_0betnp1.instance([instanceData[instanceID].participants[0], instanceData[instanceID].participants[2]]);
        emit NewInstance(0, instanceList[0]);
        _tokenState |= 4;
        continue;
      }
      if (_tokenState & 4 == 4) {
        // <---  auto transition  --->
        if (0 == Choreography_0betnp1.getTokenState(instanceList[0])) {
          _tokenState &= ~uint(4);
          instanceList[1] = Choreography_1661x4r.instance([instanceData[instanceID].participants[0], instanceData[instanceID].participants[1]]);
          emit NewInstance(1, instanceList[1]);
          _tokenState |= 0;
          break; // is end
        }
      }
      break;
    }
    
    instanceData[instanceID].state.tokenState = _tokenState;
    
    console.log(
      "ChannelResolverCallChoreoChained: new token state is %d",
       _tokenState
    );
  }

}