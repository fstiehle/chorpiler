//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessExecution {
  function enact(uint id) external;
}

contract XORAND is IProcessExecution {
  uint public tokenState = 1;
  address[3] public participants;
  event Task(uint id);
  bool public items = false;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function setItems(bool _items) external {
    items = _items;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    console.log(
      "XORAND: current token state is %d, sender %s trying to execute task %d",
      _tokenState,
      msg.sender,
      id
    );
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_1vnykqp Order goods --->
        if (1 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 6;
          emit Task(1);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_16lc74v Produce goods --->
        if (2 == id && msg.sender == participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 8;
          emit Task(2);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_07t2zjo Inform customer --->
        if (3 == id && msg.sender == participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(4);
          _tokenState |= 16;
          emit Task(3);
          id = 0;
          continue;
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- ChoreographyTask_056ylqg Ship goods --->
        if (4 == id && msg.sender == participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(32);
          _tokenState |= 0;
          emit Task(4);
          break; // is end
        }
      }
      if (_tokenState & 6 == 6) {
        if (items == true) {
          // <---  auto transition  --->
          _tokenState &= ~uint(6);
          _tokenState |= 32;
          continue;
        }
      }
      if (_tokenState & 24 == 24) {
        // <---  auto transition  --->
        _tokenState &= ~uint(24);
        _tokenState |= 32;
        continue;
      }
      break;
    }

    tokenState = _tokenState;
    console.log(
      "XORAND: new token state is %d",
       _tokenState
    );
  }

}
