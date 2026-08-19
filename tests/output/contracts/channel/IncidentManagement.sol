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
    bool resolved;
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
    bytes32 intsanceID;
    IProcessInstance.InstanceState newState;
    bytes[] signatures;
    bytes32 OP_RETURN;
  }

  function enact(bytes32 _instanceID, uint id) external;
  function getTokenState(bytes32 _instanceID) external view returns (uint);
  function instance(uint _nonce, address[5] memory participants) external returns (bytes32);
  function submit(bytes32 _channelID, Step calldata _step) external;
}

IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

contract IncidentManagement is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  mapping(bytes32 => IProcessInstance.InstanceData) public instanceData;
  event Task(uint id);
  
  function setResolved(bytes32 instanceID, bool _resolved) external {
    instanceData[instanceID].state.resolved = _resolved;
  }

  function instance(uint _nonce, address[5] memory _participants) external returns (bytes32) {
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
        resolved: false
      })
    });
    console.log("IncidentManagement: new instance registered with ID (see below)"); console.logBytes32(id);
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
      console.log("IncidentManagement: new dispute (stuck in start event) registered with channelID");
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
        console.log("IncidentManagement: new dispute registered with channelID");
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
      "IncidentManagement: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_1586fdc Customer Has a Problem --->
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
        // <--- ChoreographyTask_1y1xlzg Get problem description --->
        if (2 == id && msg.sender == instanceData[instanceID].participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          emit Task(2);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_0uo8k5k Explain solution --->
        if (3 == id && msg.sender == instanceData[instanceID].participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(8);
          _tokenState |= 0;
          emit Task(3);
          break; // is end
        }
      }
      if (_tokenState & 4 == 4) {
        if (instanceData[instanceID].state.resolved==true) {
          // <---  auto transition  --->
          _tokenState &= ~uint(4);
          _tokenState |= 8;
          continue;
        }
        else {
          // <--- ChoreographyTask_0z1rm3g Ask 1st level support --->
          if (4 == id && msg.sender == instanceData[instanceID].participants[1]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(4);
            _tokenState |= 16;
            emit Task(4);
            id = 0;
            continue;
          }
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- ChoreographyTask_1qccz6z Provide feedback --->
        if (5 == id && msg.sender == instanceData[instanceID].participants[2]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(32);
          _tokenState |= 8;
          emit Task(5);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 16 == 16) {
        if (instanceData[instanceID].state.resolved==true) {
          // <---  auto transition  --->
          _tokenState &= ~uint(16);
          _tokenState |= 32;
          continue;
        }
        else {
          // <--- ChoreographyTask_1qslyew Ask 2nd level support --->
          if (6 == id && msg.sender == instanceData[instanceID].participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(16);
            _tokenState |= 64;
            emit Task(6);
            id = 0;
            continue;
          }
        }
      }
      if (_tokenState & 64 == 64) {
        if (instanceData[instanceID].state.resolved==true) {
          // <---  auto transition  --->
          _tokenState &= ~uint(64);
          _tokenState |= 256;
          continue;
        }
        else {
          // <--- ChoreographyTask_15fmbmw Ask developer --->
          if (7 == id && msg.sender == instanceData[instanceID].participants[3]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(64);
            _tokenState |= 128;
            emit Task(7);
            id = 0;
            continue;
          }
        }
      }
      if (_tokenState & 128 == 128) {
        // <--- ChoreographyTask_15tec1l Provide feedback --->
        if (8 == id && msg.sender == instanceData[instanceID].participants[4]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(128);
          _tokenState |= 256;
          emit Task(8);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 256 == 256) {
        // <--- ChoreographyTask_1ecmkkd Provide feedback --->
        if (9 == id && msg.sender == instanceData[instanceID].participants[3]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(256);
          _tokenState |= 32;
          emit Task(9);
          id = 0;
          continue;
        }
      }
      break;
    }
    
    instanceData[instanceID].state.tokenState = _tokenState;
    
    console.log(
      "IncidentManagement: new token state is %d",
       _tokenState
    );
  }

}