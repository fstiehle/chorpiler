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
    address[5] participants;
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
  function instance(address[5] memory participants) external returns (uint);
  function submit(bytes32 id, Step calldata _step) external;
}

IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

contract SupplyChain is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  mapping(uint => IProcessInstance.InstanceData) public instanceData;
  uint private nextId = 0;
  event Task(uint id);

  function instance(address[5] memory _participants) external returns (uint) {
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
      "SupplyChain: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0fs2cuu Order Goods --->
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
        // <--- ChoreographyTask_006cwga Place Order for Supplies --->
        if (2 == id && msg.sender == instanceData[instanceID].participants[4]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 12;
          emit Task(2);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_1cx0lht Forward Order for Supplies --->
        if (3 == id && msg.sender == instanceData[instanceID].participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(4);
          _tokenState |= 16;
          emit Task(3);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_1lvykr0 Place Order for Transport --->
        if (4 == id && msg.sender == instanceData[instanceID].participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(8);
          _tokenState |= 32;
          emit Task(4);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 48 == 48) {
        // <--- ChoreographyTask_16xqypd Request Details --->
        if (5 == id && msg.sender == instanceData[instanceID].participants[3]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(48);
          _tokenState |= 64;
          emit Task(5);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 64 == 64) {
        // <--- ChoreographyTask_0uqv9gl Provide Details --->
        if (6 == id && msg.sender == instanceData[instanceID].participants[2]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(64);
          _tokenState |= 128;
          emit Task(6);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 128 == 128) {
        // <--- ChoreographyTask_1pt59s6 Send Waybill --->
        if (7 == id && msg.sender == instanceData[instanceID].participants[2]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(128);
          _tokenState |= 256;
          emit Task(7);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 256 == 256) {
        // <--- ChoreographyTask_0g98slq Deliver Supplies --->
        if (8 == id && msg.sender == instanceData[instanceID].participants[3]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(256);
          _tokenState |= 512;
          emit Task(8);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 512 == 512) {
        // <--- ChoreographyTask_0c08h7c Report Start of Production --->
        if (9 == id && msg.sender == instanceData[instanceID].participants[4]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(512);
          _tokenState |= 1024;
          emit Task(9);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 1024 == 1024) {
        // <--- ChoreographyTask_1mgz3z1 Deliver Goods --->
        if (10 == id && msg.sender == instanceData[instanceID].participants[4]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1024);
          _tokenState |= 0;
          emit Task(10);
          break; // is end
        }
      }
      break;
    }
    
    instanceData[instanceID].state.tokenState = _tokenState;
    
    console.log(
      "SupplyChain: new token state is %d",
       _tokenState
    );
  }

}