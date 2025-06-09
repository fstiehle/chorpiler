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
        if (conditions & 2 == 2) {
          // <---  auto transition  --->
          _tokenState &= ~uint(1);
          _tokenState |= 0;
          break; // is end
        }
        else {
          // <--- sid-41EE5DD3-FF50-459C-AB5C-4B8AF8920ADF Angebotsannahme übermitteln --->
          if (2 == id && msg.sender == participants[4]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 4;
          continue; 
          }
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
      if (_tokenState & 4 == 4) {
        // <--- sid-2E744151-8322-42BC-8E47-9F20DBAA5051 unausgefüllten Vertrag bereitstellen --->
        if (3 == id && msg.sender == participants[6]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        continue; 
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- sid-FB6CF249-2E77-4FC0-B2F9-121368C6268B ausgefüllten Vertrag zurückschicken --->
        if (4 == id && msg.sender == participants[8]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8);
        _tokenState |= 16;
        continue; 
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- sid-25E661B1-D3AD-4CD6-AE14-06D2C466C784 Genehmigung weiterleiten --->
        if (5 == id && msg.sender == participants[10]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(16);
        _tokenState |= 0;
        break; // is end
        }
      }
      break;
    }

    tokenState = _tokenState;
  }

}