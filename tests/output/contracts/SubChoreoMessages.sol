//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcess {
  function enact(uint id) external;

  function getTokenState() external view returns (uint);
}

contract SubChoreoMessages is IProcess {
  uint[2] public tokenState;
  address[3] public participants;
  event Task(uint id);
  // Case Variable conditions
  uint public conditions = 0;

  constructor(address[3] memory _participants) {
    participants = _participants;
    tokenState[0] = 1;
  }

  function getTokenState() external view returns (uint) {
    return tokenState[0];
  }

  function enact(uint id) public {
    uint _tokenState = tokenState[0];

    console.log(
      "SubChoreoMessages: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );

    while (_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0hy9n0g order pizza --->
        if (1 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          emit Task(1);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 4 == 4) {
        if (conditions == 1) {
          // <--- ChoreographyTask_1l3cbhv New Activity --->
          if (3 == id && 0 == tokenState[1] && msg.sender == participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(4);
            _tokenState |= 0;
            emit Task(3);
            break; // is end
          }
        } else {
          // <--- ChoreographyTask_175oxwe deliver pizza --->
          if (2 == id && 0 == tokenState[1] && msg.sender == participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(4);
            _tokenState |= 0;
            emit Task(2);
            break; // is end
          }
        }
      }
      if (_tokenState & 2 == 2) {
        // <---  auto transition  --->
        _tokenState &= ~uint(2);
        tokenState[1] = 1;
        _tokenState |= 4;
        continue;
      }
      break;
    }

    tokenState[0] = _tokenState;

    console.log("SubChoreoMessages: new token state is %d", _tokenState);
  }

  function ChoreographyTask_0hy9n0g(uint _conditions) external {
    require(tokenState[0] & 1 == 1);
    require(msg.sender == participants[0], "Invalid initiator");

    conditions = _conditions;

    console.log("Set uint conditions to", _conditions);
    enact(1);
  }

  function ChoreographyTask_175oxwe(uint _conditions) external {
    require(tokenState[0] & 4 == 4);
    require(0 == tokenState[1], "SubChoreography not completed");
    require(msg.sender == participants[2], "Invalid initiator");

    conditions = _conditions;

    console.log("Set uint conditions to", _conditions);
    enact(2);
  }

  function ChoreographyTask_1l3cbhv(uint _conditions) external {
    require(tokenState[0] & 4 == 4);
    require(0 == tokenState[1], "SubChoreography not completed");
    require(msg.sender == participants[2], "Invalid initiator");
    require(conditions == 1, "Decision condition not met");

    conditions = _conditions;

    console.log("Set uint conditions to", _conditions);
    enact(3);
  }

  function ChoreographyTask_03r94ad(uint _conditions) external {
    require(tokenState[1] & 1 == 1);
    require(msg.sender == participants[0], "Invalid initiator");

    conditions = _conditions;

    console.log("Set uint conditions to", _conditions);
    SubChoreography_0lqe5k1(1);
  }

  function SubChoreography_0lqe5k1(uint id) public {
    uint _tokenState = tokenState[1];

    console.log(
      "SubChoreography_0lqe5k1: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );

    while (_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_03r94ad New Activity --->
        if (1 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          emit Task(1);
          break; // is end
        }
      }
      break;
    }

    tokenState[1] = _tokenState;

    console.log("SubChoreography_0lqe5k1: new token state is %d", _tokenState);
  }
}
