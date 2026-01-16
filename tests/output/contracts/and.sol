//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract and {
    uint public tokenState = 1;
    address[3] public participants;
    uint public conditions;

    constructor(address[3] memory _participants) {
        participants = _participants;
    }

    function setConditions(uint _conditions) external {
        conditions = _conditions;
    }

    function enact(uint id) external {
        uint _tokenState = tokenState;

        while (_tokenState != 0) {
            if (_tokenState & 1 == 1) {
                // <--- ChoreographyTask_0hy9n0g order pizza --->
                if (0 == id && msg.sender == participants[0]) {
                    // <--- custom code for task here --->
                    _tokenState &= ~uint(1);
                    _tokenState |= 6;
                    continue;
                }
            }
            if (_tokenState & 2 == 2) {
                // <--- ChoreographyTask_049nrqq confirm Payment --->
                if (1 == id && msg.sender == participants[1]) {
                    // <--- custom code for task here --->
                    _tokenState &= ~uint(2);
                    _tokenState |= 8;
                    continue;
                }
            }
            if (_tokenState & 4 == 4) {
                // <--- ChoreographyTask_1yts45g make pizza --->
                if (2 == id && msg.sender == participants[1]) {
                    // <--- custom code for task here --->
                    _tokenState &= ~uint(4);
                    _tokenState |= 16;
                    continue;
                }
            }
            if (_tokenState & 24 == 24) {
                // <---  auto transition  --->
                _tokenState &= ~uint(24);
                _tokenState |= 0;
                break; // is end
            }
            break;
        }

        tokenState = _tokenState;
    }
}
