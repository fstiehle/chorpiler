//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract PizzaDelivery {
  uint public tokenState = 1;
  address[3] public participants;
  uint public conditions;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }
  function setconditions(uint _conditions) external {
    conditions = _conditions;
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
        // <--- ChoreographyTask_1jrfmx8 Announce Delivery --->
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
        // <--- ChoreographyTask_1wapvxj New Activity --->
        if ( 
        (conditions & 2 == 2)&& (conditions & 3 == 3)
        && 
        4 == id
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
        (conditions & 1 == 1)
        ) {
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        continue; 
        }
        // <---  auto transition  --->
        if ( 
        (conditions & 2 == 2)
        ) {
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        continue; 
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_1797ws1 Deliver Pizza --->
        if ( 
        3 == id
        && 
        msg.sender == participants[2]
        ) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 0;
        break; // is end
        }
      }
      break;
    }

    tokenState = _tokenState;
  }

}