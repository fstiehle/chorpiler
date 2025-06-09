//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract test_sid_fe670116_e806_49f4_836f_380a95822a4b {
  uint public tokenState = 1;
  address[12] public participants;
  uint public conditions;

  constructor(address[12] memory _participants) {
    participants = _participants;
  }
  function setConditions(uint _conditions) external {
    conditions = _conditions;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        if (conditions & 1 == 1) {
          // <--- sid-078D9F14-BB3F-415A-8BDF-729A134F7266 Anfrage schicken --->
          if (0 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          continue; 
          }
        }
        else {
          // <---  auto transition  --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          break; // is end
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- sid-F48C4505-3AB7-4844-8A36-28E3336DEA54 Rückmeldung übermitteln --->
        if (1 == id && msg.sender == participants[2]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 1;
        continue; 
        }
      }
      break;
    }

    tokenState = _tokenState;
  }

}