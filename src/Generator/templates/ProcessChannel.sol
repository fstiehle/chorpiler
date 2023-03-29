//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ProcessChannel {
  using ECDSA for bytes32;
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
  function continueAfterDispute(uint id{{#hasConditions}}, uint cond{{/hasConditions}}) external {
    uint _disputeMadeAtUNIX = disputeMadeAtUNIX;
    require(_disputeMadeAtUNIX != 0 && _disputeMadeAtUNIX + disputeWindowInUNIX < block.timestamp, "No elapsed dispute");

    uint _tokenState = tokenState;

    {{#hasManualTransitions}}
    while(true) {
      {{#manualTransitions}}
        if ({{#condition}}(cond & {{{condition}}} == {{{condition}}}) && {{/condition}}{{#initiator}}msg.sender == participants[{{{initiator}}}] && {{/initiator}}{{{id}}} == id && (_tokenState & {{{consume}}} == {{{consume}}})) {
          _tokenState &= ~uint({{{consume}}});
          _tokenState |= {{{produce}}};
          break;
        }
      {{/manualTransitions}}
      return;
    }
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