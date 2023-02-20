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
    bytes16 salt;
    uint newTokenState;
    bytes[] signature;
  }
  uint private tokenState = 1;
  uint private index = 0;
  // TODO: better performance with mapping?
  address[{{{numberOfParticipants}}}] private participants;

  /// Timestamps for the challenge-response dispute window
  uint private disputeMadeAtUNIX = 0;
  uint private immutable disputeWindowInUNIX;

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
   function submit(Step calldata _step) external returns (bool) {
    // stuck in start event
    if (0 == disputeMadeAtUNIX && 1 == tokenState) {
      return true;
    }
    bool _check = handleStep(_step);
    // new dispute with state submission
    if (_check && 0 == disputeMadeAtUNIX) {
      disputeMadeAtUNIX = block.timestamp;
      return true;
    } else if (_check && disputeMadeAtUNIX + disputeWindowInUNIX > block.timestamp) {
      return true;
    }
    return false;
  }

  /**
   * If a dispute window has elapsed, execution must continue through this function
   * @param id id of the activity to begin
   */
  function continueAfterDispute(uint id) external returns (uint) {
    require(disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp);
    return enact(id);
  }

  function handleStep(Step calldata _step) private returns (bool) {
    // Check that step is higher than previously recorded steps
    if (index >= _step.index) {  
      return false;
    } 
    // Verify signatures
    bytes32 payload = keccak256(
      abi.encode(_step.caseID, _step.from, _step.taskID, _step.newTokenState, _step.salt)
    );
    for (uint256 i = 0; i < participants.length; i++) {
      if (_step.signature[i].length != 65) return false;
      if (payload.toEthSignedMessageHash().recover(_step.signature[i]) != participants[uint(i)]) {
        return false;
      }
    }
    index = _step.index;
    // set token state of conformance contract = _step.newTokenState;
    return true;
  }

  function enact(uint id) {{{enactmentVisibility}}} returns (uint) {
    {{#manualTransitions}}
    if ({{#initiator}}msg.sender == participants[{{{initiator}}}] && {{/initiator}}{{{id}}} == id && (tokenState & {{{consume}}} == {{{consume}}})) {
      tokenState &= ~uint({{{consume}}});
      tokenState |= {{{produce}}};
    }
    {{/manualTransitions}}
    {{#autonomousTransitions}}
    if (tokenState & {{{consume}}} == {{{consume}}}) {
      tokenState &= ~uint({{{consume}}});
      tokenState |= {{{produce}}};
    }
    {{/autonomousTransitions}}
    return tokenState;
  }
}