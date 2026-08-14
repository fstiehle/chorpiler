//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IProcessExecution {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}

contract sid_1b6a99e6_b701_40a6_8f04_86d715a76648 is IProcessExecution {
  uint private tokenState = 1;
  address[10] public participants;

  // Case Variable conditions
  uint public conditions;

  function setConditions(uint _conditions) external {
    conditions = _conditions;
  }

  constructor(address[10] memory _participants) {
    participants = _participants;
  }

  function getTokenState() external view returns (uint) {
    return tokenState;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- sid-C12DEEB5-86BF-4254-BB68-C930FD0905D6 Bewerbung und Eingangsbestätigung senden --->
        if (0 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          continue;
        }
      }
      if (_tokenState & 2 == 2) {
        if (conditions & 1 == 1) {
          // <--- sid-63049054-FF0D-448E-A42E-7B917601D74C Fehlende Unterlagen anfordern --->
          if (1 == id && msg.sender == participants[2]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(2);
            _tokenState |= 4;
            continue;
          }
        }
        else {
          // <---  auto transition  --->
          _tokenState &= ~uint(2);
          _tokenState |= 8;
          continue;
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- sid-9153A3B6-9D23-44BA-A624-2B6C91C8355F Fehlende Unterlagen schicken --->
        if (2 == id && msg.sender == participants[4]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(4);
          _tokenState |= 8;
          continue;
        }
      }
      if (_tokenState & 8 == 8) {
        if (conditions & 2 == 2) {
          // <--- sid-996BBBD2-CA44-45A3-BD54-6C7090363FBF Zusage senden --->
          if (3 == id && msg.sender == participants[6]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(8);
            _tokenState |= 0;
            break; // is end
          }
        }
        else {
          // <--- sid-510EFA3E-DFC7-4FCE-A5B1-57AB528CFBB9 Absage senden --->
          if (4 == id && msg.sender == participants[8]) {
            // <--- custom code for task here --->
            _tokenState &= ~uint(8);
            _tokenState |= 0;
            break; // is end
          }
        }
      }
      break;
    }

    tokenState = _tokenState;
  }

}
