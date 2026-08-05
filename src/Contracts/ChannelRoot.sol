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
    uint instanceID;
    address[] participants;
    address resolveContract;
  }
  struct Proof {
    bytes[] signatures;
    bytes32 stateHash;
    bytes32 OP_RETURN;
  }

  /*
  Registers a new channel, its resolve contract address, and participating participants.
  */
  function register(Channel calldata _channel) external;

  function getChannel(bytes32 _id) external view returns (Channel memory);

  function verify(bytes32 _id, Proof calldata _step) external returns (bool);
}

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract ChannelRoot is IChannelRoot {
  using ECDSA for bytes32;
  using MessageHashUtils for bytes32;
  mapping(bytes32 => Channel) private _channels;

  function register(Channel calldata _channel) external {
    bytes32 id = keccak256(
      abi.encode(
        _channel.instanceID,
        _channel.participants,
        _channel.resolveContract
      )
    );
    // write to channel if id doesn't exist yet
    require(
      _channels[id].resolveContract == address(0),
      "Channel already exists"
    );
    _channels[id] = _channel;
  }

  function verify(
    bytes32 _id,
    Proof calldata _step
  ) external view returns (bool) {
    require(
      _channels[_id].resolveContract != address(0),
      "Channel does not exist"
    );
    bytes32 payload = keccak256(abi.encode(_step.stateHash, _step.OP_RETURN));

    for (uint i = 0; i < _channels[_id].participants.length; i++) {
      if (
        payload.toEthSignedMessageHash().recover(_step.signatures[i]) !=
        _channels[_id].participants[i]
      ) {
        return false;
      }
    }
    return true;
  }

  function getChannel(bytes32 _id) external view returns (Channel memory) {
    return _channels[_id];
  }
}
