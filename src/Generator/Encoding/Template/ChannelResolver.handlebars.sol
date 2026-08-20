//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

{{#if options.debug}}
{{#if (isString options.debug)}}
import "{{options.debug}}";
{{else}}
import "hardhat/console.sol";
{{/if}}

{{/if}}
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
    bytes32 intsanceID;
    IProcessInstance.InstanceState newState;
    bytes[] signatures;
    bytes32 OP_RETURN;
  }

  function enact(bytes32 _instanceID, uint id) external;
  function getTokenState(bytes32 _instanceID) external view returns (uint);
  function instance(uint _nonce, address[{{{numberOfParticipants}}}] memory participants) external returns (bytes32);
  function submit(bytes32 _channelID, Step calldata _step) external;
}
{{! ---- No Whitespace ---- }}
{{! ---- // List/declarations of called contracts and their interfaces ---- }}
{{> calls}}

{{#if options.rootAddress}}
IChannelRoot constant Channel_Root = IChannelRoot({{options.rootAddress}});
{{else}}
IChannelRoot constant Channel_Root = IChannelRoot(0x0000000000000000000000000000000000000000);
{{/if}}

contract {{{modelID}}} is IChannelResolver {
  uint public immutable disputeWindowInUNIX = 86400;

  {{> parameters }}

  {{> casevariables }}

  {{> constructor }}

  /**
   * Trigger new dispute or submit new state to elapse current dispute state
   * @param _step Last unanimously signed step, or empty step if process is stuck in start event
   */
   function submit(bytes32 _channelID, Step calldata _step) external {
    uint _disputeMadeAtUNIX = instanceData[_step.intsanceID].disputeMadeAtUNIX;
    if (0 == _step.newState.index && 0 == _disputeMadeAtUNIX) {
      // stuck in start event
      instanceData[_step.intsanceID].disputeMadeAtUNIX = block.timestamp;
      {{#if options.debug}}
      console.log("{{{modelID}}}: new dispute (stuck in start event) registered with channelID");
      console.logBytes32(_channelID);
      {{/if}}
    }
    else {
      if (checkStep(_channelID, _step)) {
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
        {{#if options.debug}}
        console.log("{{{modelID}}}: new dispute registered with channelID");
        console.logBytes32(_channelID);
        {{/if}}
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

  function getTokenState({{#if isInstanced}}bytes32 instanceID{{/if}}) external view returns (uint) {
    return {{> tokenstate id=0 }};
  }

  {{! ---- // Main Enact Function ---- }}
  function enact({{#if isInstanced}}bytes32 instanceID, {{/if}}uint id) {{#if hasDataTasks}}public{{else}}external{{/if}} {
    {{> states }}
  }
  {{! ---- // Tasks that set casevariables ---- }}
  {{> datatasks }}

  {{! ---- // Sub process enactment functions ---- }}
  {{> subprocesses }}
}