//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessExecution {
    function enact(uint id) external;
}

contract IncidentManagement is IProcessExecution {
  uint public tokenState = 1;
  address[5] public participants;
  event Task(uint id);
  bool public resolved = false;

  constructor(address[5] memory _participants) {
    participants = _participants;
  }

  function setResolved(bool _resolved) external {
    resolved = _resolved;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    console.log(
        "IncidentManagement: current token state is %d, sender %s trying to execute task %d",
        _tokenState,
        msg.sender,
        id
    );
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_1586fdc Customer Has a Problem --->
        if (1 == id && msg.sender == participants[0]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(1);
            _tokenState |= 2;
            emit Task(1);
            id = 0;
            continue;
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_1y1xlzg Get problem description --->
        if (2 == id && msg.sender == participants[1]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(2);
            _tokenState |= 4;
            emit Task(2);
            id = 0;
            continue;
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_0uo8k5k Explain solution --->
        if (3 == id && msg.sender == participants[1]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(8);
            _tokenState |= 0;
            emit Task(3);
            break; // is end
        }
      }
      if (_tokenState & 4 == 4) {
        if (resolved==true) {
            // <---  auto transition  --->
            _tokenState &= ~uint(4);
            _tokenState |= 8;
            continue;
        }
        else {
            // <--- ChoreographyTask_0z1rm3g Ask 1st level support --->
            if (4 == id && msg.sender == participants[1]) {
                // <--- custom code for task here --->
                _tokenState &= ~uint(4);
                _tokenState |= 16;
                emit Task(4);
                id = 0;
                continue;
            }
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- ChoreographyTask_1qccz6z Provide feedback --->
        if (5 == id && msg.sender == participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(32);
            _tokenState |= 8;
            emit Task(5);
            id = 0;
            continue;
        }
      }
      if (_tokenState & 16 == 16) {
        if (resolved==true) {
            // <---  auto transition  --->
            _tokenState &= ~uint(16);
            _tokenState |= 32;
            continue;
        }
        else {
            // <--- ChoreographyTask_1qslyew Ask 2nd level support --->
            if (6 == id && msg.sender == participants[2]) {
                // <--- custom code for task here --->
                _tokenState &= ~uint(16);
                _tokenState |= 64;
                emit Task(6);
                id = 0;
                continue;
            }
        }
      }
      if (_tokenState & 64 == 64) {
        if (resolved==true) {
            // <---  auto transition  --->
            _tokenState &= ~uint(64);
            _tokenState |= 256;
            continue;
        }
        else {
            // <--- ChoreographyTask_15fmbmw Ask developer --->
            if (7 == id && msg.sender == participants[3]) {
                // <--- custom code for task here --->
                _tokenState &= ~uint(64);
                _tokenState |= 128;
                emit Task(7);
                id = 0;
                continue;
            }
        }
      }
      if (_tokenState & 128 == 128) {
        // <--- ChoreographyTask_15tec1l Provide feedback --->
        if (8 == id && msg.sender == participants[4]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(128);
            _tokenState |= 256;
            emit Task(8);
            id = 0;
            continue;
        }
      }
      if (_tokenState & 256 == 256) {
        // <--- ChoreographyTask_1ecmkkd Provide feedback --->
        if (9 == id && msg.sender == participants[3]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(256);
            _tokenState |= 32;
            emit Task(9);
            id = 0;
            continue;
        }
      }
      break;
    }

    tokenState = _tokenState;
    console.log(
        "IncidentManagement: new token state is %d",
        _tokenState
    );
  }

}
