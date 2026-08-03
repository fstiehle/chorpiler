//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

{{#if options.debug}}
import "hardhat/console.sol";
{{/if}}

interface IChannelRoot {
  // TODO: Variable Packing
  struct Channel {
    uint instanceID
    address[] participants;
    address resolveContract;
  }
  struct Proof {
    bytes[] calldata signatures;
    bytes32 stateHash;
    bytes32 OP_RETURN;
  }

 /*
  Registers a new channel, its resolve contract address, and participating participants.
  */
  function register(Channel calldata _channel) external;
  function verify(bytes32 _id, Proof calldata _step) external returns (bool);
}

IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

interface IChannelResolver {
  struct InstanceState {
    {{!// ---- Sub Process Support ----- }}
    {{#if hasSubProcesses}}
    uint[{{{numberOfProcesses}}}] public tokenState;
    {{else}}
    uint tokenState;
    {{/if}}
    {{!// ---- Instanced Case Variables ----- }}
    {{#each caseVariables}}
    {{{expression}}}
    {{/each}}
  }
  struct InstanceData {
    address[{{{numberOfParticipants}}}] participants;
    InstanceState state;

    // state channel version index
    uint public index;
    /// Timestamps for the challenge-response dispute window
    uint public disputeMadeAtUNIX;
  }
  function enact(uint instanceID, uint id) external;
  function getTokenState(uint instanceID) external view returns (uint);
  function instance(address[{{{numberOfParticipants}}}] memory participants) external returns (uint);
  function submit(Step calldata _step) external;
}

{{! ---- // List/declarations of called contracts and their interfaces ---- }}
{{> calls}}

contract ChannelResolver{{{modelID}}} is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  {{> parameters }}

  {{> casevariables }}

  {{> constructor }}

  struct Step {
    uint index;
    uint intsanceID;
    InstanceState newState;
    bytes[{{{numberOfParticipants}}}] signatures;
  }

  /**
   * Trigger new dispute or submit new state to elapse current dispute state
   * @param _step Last unanimously signed step, or empty step if process is stuck in start event
   */
   function submit(uint id, Step calldata _step) external {
    uint _disputeMadeAtUNIX = instanceData[_step.intsanceID].disputeMadeAtUNIX;
    if (0 == _step.index && 0 == _disputeMadeAtUNIX) {
      // stuck in start event
      instanceData[_step.intsanceID].disputeMadeAtUNIX = block.timestamp;
    }
    else {
      if (checkStep(id, _step)) {
        if (0 == _disputeMadeAtUNIX) {
          // new dispute or final state
          if (_step.newTokenState != 0) {
            // new dispute with state submission
            instanceData[_step.intsanceID].disputeMadeAtUNIX = block.timestamp;
          }
          instanceData[_step.intsanceID].index = _step.index;
          instanceData[_step.intsanceID].state = _step.newState;
        } else if (_disputeMadeAtUNIX + disputeWindowInUNIX >= block.timestamp) {
          // submission to existing dispute
          instanceData[_step.intsanceID].index = _step.index;
          instanceData[_step.intsanceID].state = _step.newState;
        }
      }
    }
  }

  function checkStep(uint id, Step _step) private view returns (bool) {
    // Check that step is higher than previously recorded steps
    if (instanceData[_step.intsanceID].index >= _step.index) {
      return false;
    }
    return Channel_Root.verify(id, Proof({ TODO }))
  }

  function getTokenState({{#if isInstanced}}uint instanceID{{/if}}) external view returns (uint) {
    return {{> tokenstate id=0 }};
  }

  {{! ---- // Main Enact Function ---- }}
  function enact({{#if isInstanced}}uint instanceID, {{/if}}uint id) {{#if hasDataTasks}}public{{else}}external{{/if}} {
    {{> states }}
  }
  {{! ---- // Tasks that set casevariables ---- }}
  {{> datatasks }}
  {{! ---- // Whitespace ---- }}
  {{! ---- // Sub process enactment functions ---- }}
  {{> subprocesses }}
}