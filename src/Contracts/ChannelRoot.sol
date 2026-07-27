//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
Handles membership and existence for all channels.
1.) Register a new channel with its dispute contract (CREATE2 address)
2.) Verify a state update for a channel
*/
interface IChannelRoot {

  // TODO: Variable Packing
  struct Channel {
    uint instanceID
    address[] participants;
    address resolveContract;
  }
  struct Step {
    bytes[] calldata signatures;
    bytes32 stateHash;
    bytes32 OP_RETURN;
  }
}

 /*
  Registers a new channel, its resolve contract address, and participating participants.
  */
  function register(Channel calldata _channel) external;
  function verify(bytes32 _id, Step calldata _step) external returns (bool);
}

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ChannelRoot {
  using ECDSA for bytes32;

  mapping(bytes32 => IChannelRoot.Channel) public channels;

  function register(Channel calldata _channel) external {
    bytes32 id = keccak256(abi.encode(_channel.instance, _channel.participants, _channel.resolveContract);
    // write to channel if id doesn't exist yet
    require(channels[id].resolveContract == address(0), "Channel already exists");
    channels[id] = _channel;
  }

  function verify(bytes32 _id, Step calldata _step) external returns (bool) {
    bytes32 payload = abi.encode(_step.payload, _step.OP_RETURN);

    for (uint i = 0; i < channels[_id].participants; i++) {
      if (payload.toEthSignedMessageHash().recover(_step.signatures[i]) != channels[_id].participants[i]) {
        return false;
      }
    }
    return true;
  }

}