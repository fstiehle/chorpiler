//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract IM_ProcessChannel {
  using ECDSA for bytes32;
  struct Step {
    uint index;
    uint caseID;
    uint from;
    uint taskID;
    uint newTokenState;
    uint conditionState;
    bytes[5] signatures;
  }
  uint public tokenState = 1;
  uint public index = 0;

  /// Timestamps for the challenge-response dispute window
  uint public immutable disputeWindowInUNIX;
  uint public disputeMadeAtUNIX = 0;

  address[5] public participants; 

  /**
   * @param _participants addresses for the roles 
   * in the order (BulkBuyer, Manufacturer, Middleman, Supplier, SpecialCarrier)
   * @param _disputeWindowInUNIX time for the dispute window to remain open in UNIX.
   */
  constructor(address[5] memory _participants, uint _disputeWindowInUNIX) {
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

  function checkStep(Step calldata _step) private view returns (bool) {
    // Check that step is higher than previously recorded steps
    if (index >= _step.index) { 
      return false;
    } 
    // Verify signatures
    bytes32 payload = keccak256(
      abi.encode(_step.index, _step.caseID, _step.from, _step.taskID, _step.newTokenState, _step.conditionState)
    );

    for (uint i = 0; i < 5; i++) {
      if (payload.toEthSignedMessageHash().recover(_step.signatures[i]) != participants[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * If a dispute window has elapsed, execution must continue through this function
   * @param id id of the activity to begin
   */
  function continueAfterDispute(uint id, uint cond) external {
    uint _disputeMadeAtUNIX = disputeMadeAtUNIX;
    require(_disputeMadeAtUNIX != 0 && _disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp, "No elapsed dispute");

    uint _tokenState = tokenState;

    while(true) {
        if (msg.sender == participants[0] && 0 == id && (_tokenState & 1 == 1)) {
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          break;
        }
        if (msg.sender == participants[1] && 1 == id && (_tokenState & 2 == 2)) {
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          break;
        }
        if (msg.sender == participants[1] && 2 == id && (_tokenState & 8 == 8)) {
          _tokenState &= ~uint(8);
          _tokenState |= 0;
          break;
        }
        if (msg.sender == participants[1] && 3 == id && (_tokenState & 4 == 4)) {
          _tokenState &= ~uint(4);
          _tokenState |= 16;
          break;
        }
        if (msg.sender == participants[2] && 4 == id && (_tokenState & 32 == 32)) {
          _tokenState &= ~uint(32);
          _tokenState |= 8;
          break;
        }
        if (msg.sender == participants[2] && 5 == id && (_tokenState & 16 == 16)) {
          _tokenState &= ~uint(16);
          _tokenState |= 64;
          break;
        }
        if (msg.sender == participants[3] && 6 == id && (_tokenState & 64 == 64)) {
          _tokenState &= ~uint(64);
          _tokenState |= 128;
          break;
        }
        if (msg.sender == participants[4] && 7 == id && (_tokenState & 128 == 128)) {
          _tokenState &= ~uint(128);
          _tokenState |= 256;
          break;
        }
        if (msg.sender == participants[3] && 8 == id && (_tokenState & 256 == 256)) {
          _tokenState &= ~uint(256);
          _tokenState |= 32;
          break;
        }
      return;
    }

    while(_tokenState != 0) {
      if ((cond & 1 == 1) && (_tokenState & 16 == 16)) {
        _tokenState &= ~uint(16);
        _tokenState |= 32;
        continue;
      }
      if ((cond & 2 == 2) && (_tokenState & 64 == 64)) {
        _tokenState &= ~uint(64);
        _tokenState |= 256;
        continue;
      }
      if ((cond & 4 == 4) && (_tokenState & 4 == 4)) {
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        continue;
      }
      break;
    }

    tokenState = _tokenState;
  }

}