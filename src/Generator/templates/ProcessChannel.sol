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
    uint conditionState;
    bytes[{{{numberOfParticipants}}}] signatures;
  }
  uint public tokenState = 1;
  uint public index = 0;
  // TODO: better performance with mapping?
  address[{{{numberOfParticipants}}}] public participants;

  /// Timestamps for the challenge-response dispute window
  uint public disputeMadeAtUNIX = 0;
  uint public immutable disputeWindowInUNIX;

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
    if (0 == _step.index && 0 == _disputeMadeAtUNIX && 1 == tokenState) {
      // stuck in start event
      disputeMadeAtUNIX = block.timestamp;
    }
    else {
      bool check = checkStep(_step);
      if (check) {
        if (0 == _disputeMadeAtUNIX) {
          // new dispute or final state
          if (_step.newTokenState != 0) {
            // new dispute with state submission
            disputeMadeAtUNIX = block.timestamp;
          }
          index = _step.index;
          tokenState = _step.newTokenState;
        } else if ((_disputeMadeAtUNIX + disputeWindowInUNIX >= block.timestamp)) {
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

    for (uint i = 0; i < {{{numberOfParticipants}}}; i++) {
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
    
    {{#hasManualTransitions}}
    do {
      {{#manualTransitions}}
        if ({{#condition}}(cond & {{{condition}}} == {{{condition}}}) && {{/condition}}{{#initiator}}msg.sender == participants[{{{initiator}}}] && {{/initiator}}{{{id}}} == id && (_tokenState & {{{consume}}} == {{{consume}}})) {
          _tokenState &= ~uint({{{consume}}});
          _tokenState |= {{{produce}}};
          break;
        }
      {{/manualTransitions}}
    } while (false);
    {{/hasManualTransitions}}

    {{#hasAutonomousTransitions}}
    while(_tokenState != 0) {
      {{#autonomousTransitions}}
      if ({{#condition}}(cond & {{{condition}}} == {{{condition}}}) && {{/condition}}(_tokenState & {{{consume}}} == {{{consume}}})) {
        _tokenState &= ~uint({{{consume}}});
        _tokenState |= {{{produce}}};
        {{#isEnd}}
        break; // is end
        {{/isEnd}}
        {{^isEnd}}
        continue;
        {{/isEnd}}
      }
      {{/autonomousTransitions}}
      break;
    }
    {{/hasAutonomousTransitions}}

    tokenState = _tokenState;
  }

}