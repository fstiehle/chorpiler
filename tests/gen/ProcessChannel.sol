//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ProcessChannel {
  using ECDSA for bytes32;
  // TODO: Can we optimise the packing of this struct?
  // Intuition: No, as it is only used in calldata
  struct Step {
    uint index;
    uint from;
    uint caseID;
    uint taskID;
    uint newTokenState;
    bytes[] signatures;
  }
  uint public tokenState = 1;
  uint public index = 0;
  // TODO: better performance with mapping?
  address[6] public participants;

  /// Timestamps for the challenge-response dispute window
  uint public disputeMadeAtUNIX = 0;
  uint public immutable disputeWindowInUNIX;

  /**
   * @param _participants addresses for the roles 
   * in the order (BulkBuyer, Manufacturer, Middleman, Supplier, SpecialCarrier)
   * @param _disputeWindowInUNIX time for the dispute window to remain open in UNIX.
   */
  constructor(address[6] memory _participants, uint _disputeWindowInUNIX) {
    participants = _participants;
    disputeWindowInUNIX = _disputeWindowInUNIX;
  }

  /**
   * Trigger new dispute or submit new state to elapse current dispute state
   * @param _step Last unanimously signed step, or empty step if process is stuck in start event
   */
   function submit(Step calldata _step) external returns (bool) {
    if (0 == disputeMadeAtUNIX && 1 == tokenState) {
      // stuck in start event
      disputeMadeAtUNIX = block.timestamp;
      return true;
    }
    if (checkStep(_step) && (0 == disputeMadeAtUNIX || disputeMadeAtUNIX + disputeWindowInUNIX >= block.timestamp)) {
      // new dispute with state submission
      disputeMadeAtUNIX = block.timestamp;
      index = _step.index;
      tokenState = _step.newTokenState;
      return true;
    }

    return false;
  }

  function checkStep(Step calldata _step) private view returns (bool) {
    // Check that step is higher than previously recorded steps
    if (index >= _step.index) {  
      return false;
    } 
    // Verify signatures
    bytes32 payload = keccak256(
      abi.encode(_step.caseID, _step.from, _step.taskID, _step.newTokenState)
    );
    for (uint256 i = 0; i < participants.length; i++) {
      if (_step.signatures[i].length != 65) return false;
      if (payload.toEthSignedMessageHash().recover(_step.signatures[i]) != participants[uint(i)]) {
        return false;
      }
    }
    return true;
  }

  /**
   * If a dispute window has elapsed, execution must continue through this function
   * @param id id of the activity to begin
   */
  function continueAfterDispute(uint id) external returns (uint) {
    require(disputeMadeAtUNIX != 0 && disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp, "No elapsed dispute");

    if (msg.sender == participants[0] && 0 == id && (tokenState & 1 == 1)) {
      tokenState &= ~uint(1);
      tokenState |= 2;
    }
    if (msg.sender == participants[1] && 1 == id && (tokenState & 2 == 2)) {
      tokenState &= ~uint(2);
      tokenState |= 4;
    }
    if (msg.sender == participants[1] && 2 == id && (tokenState & 4 == 4)) {
      tokenState &= ~uint(4);
      tokenState |= 8;
    }
    if (msg.sender == participants[1] && 3 == id && (tokenState & 4 == 4)) {
      tokenState &= ~uint(4);
      tokenState |= 16;
    }
    if (msg.sender == participants[3] && 4 == id && (tokenState & 16 == 16)) {
      tokenState &= ~uint(16);
      tokenState |= 4;
    }
    if (msg.sender == participants[3] && 5 == id && (tokenState & 16 == 16)) {
      tokenState &= ~uint(16);
      tokenState |= 32;
    }
    if (msg.sender == participants[4] && 6 == id && (tokenState & 32 == 32)) {
      tokenState &= ~uint(32);
      tokenState |= 64;
    }
    if (msg.sender == participants[5] && 7 == id && (tokenState & 64 == 64)) {
      tokenState &= ~uint(64);
      tokenState |= 32;
    }
    if (msg.sender == participants[4] && 8 == id && (tokenState & 32 == 32)) {
      tokenState &= ~uint(32);
      tokenState |= 16;
    }
    if (tokenState & 8 == 8) {
      tokenState &= ~uint(8);
      tokenState |= 128;
    }
    return tokenState;
  }
}