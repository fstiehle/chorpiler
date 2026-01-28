//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IProcessExecution {
  function enact(uint id) external;
}

contract Pizza is IProcessExecution {
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
        "Pizza: current token state is %d, sender %s trying to execute task %d",
        _tokenState,
        msg.sender,
        id
    );
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0hy9n0g Order Pizza --->
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
        if (items==true) {
            // <---  auto transition  --->
            _tokenState &= ~uint(2);
            _tokenState |= 8;
            continue;
        }
        else {
            // <--- ChoreographyTask_1b2vkz9 Confirm ETA --->
            if (2 == id && msg.sender == participants[1]) {
                // <--- custom code for task here --->
                _tokenState &= ~uint(2);
                _tokenState |= 4;
                emit Task(2);
                id = 0;
                continue;
            }
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_1jrfmx8 Announce Delivery --->
        if (3 == id && msg.sender == participants[1]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(4);
            _tokenState |= 8;
            emit Task(3);
            id = 0;
            continue;
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_1797ws1 Deliver Pizza --->
        if (4 == id && msg.sender == participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(8);
            _tokenState |= 0;
            emit Task(4);
            break; // is end
        }
      }
      break;
    }

    tokenState = _tokenState;
    console.log(
        "Pizza: new token state is %d",
        _tokenState
    );
  }

}
