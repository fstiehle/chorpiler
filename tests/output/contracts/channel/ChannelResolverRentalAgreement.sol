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
    uint[2] tokenState;
    uint conditions;
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

IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

contract ChannelResolverRentalAgreement is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  mapping(uint => IProcessInstance.InstanceData) public instanceData;
  uint private nextId = 0;
  event Task(uint id);
  
  function setConditions(uint instanceID, uint _conditions) external {
    instanceData[instanceID].state.conditions = _conditions;
  }

  function instance(address[3] memory _participants) external returns (uint) {
    uint newId = nextId;
    uint[2] memory newTokenState;
    newTokenState[0] = 1;
    instanceData[newId] = IProcessInstance.InstanceData({
      disputeMadeAtUNIX: 0,
      participants: _participants,
      state: IProcessInstance.InstanceState({
        index: 0,
        tokenState: newTokenState,
        conditions: 0
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
          if (_step.newState.tokenState[0] != 0) {
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
    return instanceData[instanceID].state.tokenState[0];
  }

  function enact(uint instanceID, uint id) external {
    uint _disputeMadeAtUNIX = instanceData[instanceID].disputeMadeAtUNIX;
    require(_disputeMadeAtUNIX != 0 && _disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp, "No elapsed dispute");
    
    uint _tokenState = instanceData[instanceID].state.tokenState[0];
    
    console.log(
      "ChannelResolverRentalAgreement: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    
    while(_tokenState != 0) {
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_19lvxvh pay bond --->
        if (1 == id && msg.sender == instanceData[instanceID].participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          emit Task(1);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_001w5ww file claim for bond --->
        if (2 == id && msg.sender == instanceData[instanceID].participants[2]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(8);
          _tokenState |= 16;
          emit Task(2);
          id = 0;
          continue;
        }
        // <--- ChoreographyTask_00l7an5 release bond --->
        if (6 == id && msg.sender == instanceData[instanceID].participants[2]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(8);
          _tokenState |= 64;
          emit Task(6);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- ChoreographyTask_1h13qrq file dispute --->
        if (3 == id && msg.sender == instanceData[instanceID].participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(16);
          _tokenState |= 0;
          emit Task(3);
          break; // is end
        }
        // <--- ChoreographyTask_0946is9 accept claim --->
        if (4 == id && msg.sender == instanceData[instanceID].participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(16);
          _tokenState |= 32;
          emit Task(4);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- ChoreographyTask_0235k4i transfer bond to landlord --->
        if (5 == id && msg.sender == instanceData[instanceID].participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(32);
          _tokenState |= 0;
          emit Task(5);
          break; // is end
        }
      }
      if (_tokenState & 64 == 64) {
        // <--- ChoreographyTask_07z22w1 refund bond to tenant --->
        if (7 == id && msg.sender == instanceData[instanceID].participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(64);
          _tokenState |= 0;
          emit Task(7);
          break; // is end
        }
      }
      if (_tokenState & 128 == 128) {
        // <---  auto transition  --->
        _tokenState &= ~uint(128);
        instanceData[instanceID].state.tokenState[1] = 1;
        _tokenState |= 256;
        continue;
      }
      if (_tokenState & 1 == 1) {
        if (instanceData[instanceID].state.conditions & 1 == 1) {
          // <---  auto transition  --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          break; // is end
        }
        else {
          // <---  auto transition  --->
          _tokenState &= ~uint(1);
          _tokenState |= 130;
          continue;
        }
      }
      if (_tokenState & 260 == 260) {
        // <---  auto transition  --->
        if (0 == instanceData[instanceID].state.tokenState[1]) {
          _tokenState &= ~uint(260);
          _tokenState |= 8;
          continue;
        }
      }
      break;
    }
    
    instanceData[instanceID].state.tokenState[0] = _tokenState;
    
    console.log(
      "ChannelResolverRentalAgreement: new token state is %d",
       _tokenState
    );
  }

  function SubChoreography_1sp0n7o(uint instanceID, uint id) external {
    uint _disputeMadeAtUNIX = instanceData[instanceID].disputeMadeAtUNIX;
    require(_disputeMadeAtUNIX != 0 && _disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp, "No elapsed dispute");
    
    uint _tokenState = instanceData[instanceID].state.tokenState[1];
    
    console.log(
      "SubChoreography_1sp0n7o: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_1hddg8r pay rent --->
        if (1 == id && msg.sender == instanceData[instanceID].participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 1;
          emit Task(1);
          id = 0;
          continue;
        }
        // <--- ChoreographyTask_07y6gqp end tenancy --->
        if (2 == id && msg.sender == instanceData[instanceID].participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          emit Task(2);
          break; // is end
        }
      }
      break;
    }
    
    instanceData[instanceID].state.tokenState[1] = _tokenState;
    
    console.log(
      "SubChoreography_1sp0n7o: new token state is %d",
       _tokenState
    );
  }
  
}