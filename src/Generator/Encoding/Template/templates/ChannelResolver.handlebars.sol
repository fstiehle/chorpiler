//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
Handles membership and existence for all channels.
1.) Register a new channel with its dispute contract (CREATE2 address)
2.) Verify a state update for a channel
*/
interface IChannelRoot {
  struct Channel {
    uint instanceID
    address[] participants;
    address resolveContract;
    bytes32 OP_RETURN;
  }

  struct Step {
    uint index;
    uint caseID;
    uint from;
    uint taskID;
    uint newTokenState;
    uint conditionState;
    bytes[{{{numberOfParticipants}}}] signatures;
  }
  /*
  Registers a new channel, its resolve contract address, and participating participants.
  */
  function register(Channel calldata _channel) external returns (uint);
  function verify(uint instanceID, bytes32 payload) external view returns (bool);
}

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ChannelRoot {
  using ECDSA for bytes32;

  mapping(bytes32 => IChannelRoot.Channel) public channels;

  function verify(uint instance, bytes32 payload) private view returns (bool) {
    bytes32 id = keccak256(abi.encode(instance, msg.sender);


    for (uint i = 0; i < chanels[]; i++) {
      if (payload.toEthSignedMessageHash().recover(_step.signatures[i]) != participants[i]) {
        return false;
      }
    }
    return true;
  }

  function checkStep(bytes32 payload) private view returns (bool) {
    // Check that step is higher than previously recorded steps
    if (index >= _step.index) {
      return false;
    }
    // Verify signatures
    bytes32 payload = keccak256(
      abi.encode(_step.index, _step.caseID, _step.from, _step.taskID, _step.newTokenState, _step.conditionState)
    );

    for (uint i = 0; i < {{{numberOfParticipants}}}; i++) {
      if (payload.toEthSignedMessageHash().recover(_step.signatures[i]) != participants[i]) {
        return false;
      }
    }
    return true;
  }

  struct Step {
    uint index;
    uint caseID;
    uint from;
    uint taskID;
    uint newTokenState;
    uint conditionState;
    bytes[{{{numberOfParticipants}}}] signatures;
  }
  uint public tokenState = 1;
  uint public index = 0;

  /// Timestamps for the challenge-response dispute window
  uint public immutable disputeWindowInUNIX;
  uint public disputeMadeAtUNIX = 0;

  address[{{{numberOfParticipants}}}] public participants;

  /**
   * @param _participants addresses for the roles
   * in the order (BulkBuyer, Manufacturer, Middleman, Supplier, SpecialCarrier)
   * @param _disputeWindowInUNIX time for the dispute window to remain open in UNIX.
   */
  constructor(address[{{{numberOfParticipants}}}] memory _participants, uint _disputeWindowInUNIX) {
    participants = _participants;
    disputeWindowInUNIX = _disputeWindowInUNIX;
  }

  /**
   * Trigger new dispute or submit new state to elapse current dispute state
   * @param _step Last unanimously signed step, or empty step if process is stuck in start event
   */
   function submit(Step calldata _step) external {
    uint _disputeMadeAtUNIX = disputeMadeAtUNIX;
    if (0 == _step.index && 0 == _disputeMadeAtUNIX) {
      // stuck in start event
      disputeMadeAtUNIX = block.timestamp;
    }
    else {
      if (checkStep(_step)) {
        if (0 == _disputeMadeAtUNIX) {
          // new dispute or final state
          if (_step.newTokenState != 0) {
            // new dispute with state submission
            disputeMadeAtUNIX = block.timestamp;
          }
          index = _step.index;
          tokenState = _step.newTokenState;
        } else if (_disputeMadeAtUNIX + disputeWindowInUNIX >= block.timestamp) {
          // submission to existing dispute
          index = _step.index;
          tokenState = _step.newTokenState;
        }
      }
    }
  }

  /**
   * If a dispute window has elapsed, execution must continue through this function
   * @param id id of the activity to begin
   */
  function continueAfterDispute(uint id{{#hasConditions}}, uint cond{{/hasConditions}}) external {

  }

}