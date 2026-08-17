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
    bytes32 instanceID;
    address[] participants;
    address resolveContract;
  }
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

  function getChannel(bytes32 _id) external view returns (Channel memory);

  function verify(Proof calldata _step) external returns (bool);
}

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract ChannelRoot is IChannelRoot {
  bytes32 public constant CHAIN_ID = "proto-evm-v1"; // Prevent replay accross different chains or protocol versions
  using ECDSA for bytes32;
  using MessageHashUtils for bytes32;
  mapping(bytes32 => Channel) private _channels;

  function register(Channel calldata _channel) external {
    bytes32 _channelID = keccak256(
      abi.encode(
        _channel.instanceID,
        _channel.participants,
        _channel.resolveContract
      )
    );
    // write to channel if id doesn't exist yet
    require(
      _channels[_channelID].resolveContract == address(0),
      "Channel already exists"
    );
    _channels[_channelID] = _channel;
  }

  function verify(Proof calldata _step) external view returns (bool) {
    require(
      _channels[_step.channelID].resolveContract != address(0),
      "Channel does not exist"
    );
    bytes32 payload = keccak256(
      abi.encode(CHAIN_ID, _step.channelID, _step.stateHash, _step.OP_RETURN)
    );

    for (uint i = 0; i < _channels[_step.channelID].participants.length; i++) {
      if (
        payload.toEthSignedMessageHash().recover(_step.signatures[i]) !=
        _channels[_step.channelID].participants[i]
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
