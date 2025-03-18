//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract PIZZA_ProcessExecution {
  uint public tokenState = 1;
  address[3] public participants;
  bool public items = false;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }
  function setitems(bool _items) external {
    items = _items;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0hy9n0g Order Pizza --->
        if ( 
        1 == id
        && 
        msg.sender == participants[0]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_1b2vkz9 Confirm ETA --->
        if ( 
        2 == id
        && 
        msg.sender == participants[1]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        id = 0;
        continue; 
        }
        // <---  auto transition  --->
        if ( 
        (items==true)
        && 
        4 == id
        ) {
        _tokenState &= ~uint(2);
        _tokenState |= 8;
        continue; 
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_1jrfmx8 Announce Delivery --->
        if ( 
        3 == id
        && 
        msg.sender == participants[1]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_1797ws1 Deliver Pizza --->
        if ( 
        4 == id
        && 
        msg.sender == participants[2]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8);
        _tokenState |= 0;
        id = 0;
        break; // is end
        }
      }
      break;
    }

    tokenState = _tokenState;
  }
}