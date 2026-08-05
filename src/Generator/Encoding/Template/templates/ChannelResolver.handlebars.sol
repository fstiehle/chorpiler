//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

{{#if options.debug}}
import "hardhat/console.sol";
{{/if}}

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
    {{!// ---- Sub Process Support ----- }}
    {{#if hasSubProcesses}}
    uint[{{{numberOfProcesses}}}] tokenState;
    {{else}}
    uint tokenState;
    {{/if}}
    {{!// ---- Instanced Case Variables ----- }}
    {{#each caseVariables}}
    {{{type}}} {{{name}}};
    {{/each}}
    uint index; // state channel version index
  }

  // Encapsulating static instance data (need not to be signed)
  struct InstanceData {
    address[{{{numberOfParticipants}}}] participants;
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
  function instance(address[{{{numberOfParticipants}}}] memory participants) external returns (uint);
  function submit(bytes32 id, Step calldata _step) external;
}
{{! ---- No Whitespace ---- }}
{{! ---- // List/declarations of called contracts and their interfaces ---- }}
{{> calls}}

IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);

contract {{{modelID}}} is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  {{> parameters }}

  {{> casevariables }}

  {{> constructor }}

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
          if (_step.newState.tokenState{{#if hasSubProcesses}}[0]{{/if}} != 0) {
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

  function getTokenState({{#if isInstanced}}uint instanceID{{/if}}) external view returns (uint) {
    return {{> tokenstate id=0 }};
  }

  {{! ---- // Main Enact Function ---- }}
  function enact({{#if isInstanced}}uint instanceID, {{/if}}uint id) {{#if hasDataTasks}}public{{else}}external{{/if}} {
    {{> states }}
  }
  {{! ---- // Tasks that set casevariables ---- }}
  {{> datatasks }}

  {{! ---- // Sub process enactment functions ---- }}
  {{> subprocesses }}
}