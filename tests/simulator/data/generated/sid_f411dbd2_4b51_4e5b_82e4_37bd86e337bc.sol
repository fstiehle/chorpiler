//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IProcessExecution {
  function enact(uint id) external;
  function getTokenState() external view returns (uint);
}

contract sid_f411dbd2_4b51_4e5b_82e4_37bd86e337bc is IProcessExecution {
  uint private tokenState = 1;
  address[36] public participants;
  uint public conditions;

  constructor(
    address[36] memory _participants
  ) {
    participants = _participants;
  }

  function setConditions(uint _conditions) external {
    conditions = _conditions;
  }

  function getTokenState() external view returns (uint) {
    return tokenState;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- sid-0EA4DBDC-A23D-4B14-A487-37F90CB7A83E Angebotsanfrage&amp;#10; --->
        if (0 == id && msg.sender == participants[0]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1);
          _tokenState |= 2;
          continue;
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- sid-B0DF0381-3B62-465D-97F5-060058A3A76F Anfrage verschiedener Fluggesellschaften und Hotelketten &amp;#10; --->
        if (1 == id && msg.sender == participants[2]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 60;
          continue;
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- sid-D54302DC-C62B-4CCC-ADC2-FE79E498D733 Angebot verfassen &amp;#10; --->
        if (2 == id && msg.sender == participants[4]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(4);
          _tokenState |= 64;
          continue;
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- sid-EB3A404F-3E2B-4156-9032-301E4A9BE8C9 Angebot verfassen &amp;#10; --->
        if (3 == id && msg.sender == participants[6]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(16);
          _tokenState |= 128;
          continue;
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- sid-B54B3F49-916A-40F3-AC1C-D0994611DBB9 Angebot verfassen&amp;#10; --->
        if (4 == id && msg.sender == participants[8]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(8);
          _tokenState |= 256;
          continue;
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- sid-C02E66E6-81AB-4FDA-B878-F1E0B10C509C Angebot verfassen&amp;#10; --->
        if (5 == id && msg.sender == participants[10]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(32);
          _tokenState |= 512;
          continue;
        }
      }
      if (_tokenState & 64 == 64) {
        // <--- sid-0E1225E1-C710-40A6-9317-C887546F867A Angebot entgegennehmen &amp;#10;&amp;#10; --->
        if (6 == id && msg.sender == participants[12]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(64);
          _tokenState |= 1024;
          continue;
        }
      }
      if (_tokenState & 1024 == 1024) {
        // <--- sid-A8493F71-A42A-4A2A-B6AC-DDA993F67F34 Angebote weiterleiten &amp;#10; --->
        if (7 == id && msg.sender == participants[14]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(1024);
          _tokenState |= 2048;
          continue;
        }
      }
      if (_tokenState & 30720 == 30720) {
        // <--- sid-C05C5BDC-835F-4020-B4B2-B38318BC10C9 Angebote entgegennehmen &amp;#10; --->
        if (8 == id && msg.sender == participants[16]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(30720);
          _tokenState |= 98304;
          continue;
        }
      }
      if (_tokenState & 256 == 256) {
        // <--- sid-DA9411A4-7DEF-4C12-94F5-A8DE387E5B04 Angebot entgegennehmen&amp;#10; --->
        if (9 == id && msg.sender == participants[18]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(256);
          _tokenState |= 131072;
          continue;
        }
      }
      if (_tokenState & 128 == 128) {
        // <--- sid-D3B4422E-E160-474E-9D1F-0D9238C57600 Angebot entgegennehmen&amp;#10; --->
        if (10 == id && msg.sender == participants[20]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(128);
          _tokenState |= 262144;
          continue;
        }
      }
      if (_tokenState & 512 == 512) {
        // <--- sid-B82BF124-6C87-49E4-B7CA-9FA9EE666FF8 Angebot entgegennehmen&amp;#10; --->
        if (11 == id && msg.sender == participants[22]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(512);
          _tokenState |= 524288;
          continue;
        }
      }
      if (_tokenState & 131072 == 131072) {
        // <--- sid-C53014EC-8A19-4901-9F0E-94BE44B5B3B6 Angebote weiterleiten &amp;#10; --->
        if (12 == id && msg.sender == participants[24]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(131072);
          _tokenState |= 4096;
          continue;
        }
      }
      if (_tokenState & 262144 == 262144) {
        // <--- sid-AF25C96B-A366-423A-BA6E-781BE96A9740 Angebote weiterleiten &amp;#10;&amp;#10; --->
        if (13 == id && msg.sender == participants[26]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(262144);
          _tokenState |= 8192;
          continue;
        }
      }
      if (_tokenState & 524288 == 524288) {
        // <--- sid-16F1475D-15C7-458C-AEEA-C553F9B54103 Angebote weiterleiten &amp;#10; --->
        if (14 == id && msg.sender == participants[28]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(524288);
          _tokenState |= 16384;
          continue;
        }
      }
      if (_tokenState & 32768 == 32768) {
        // <--- sid-829861F0-222B-4005-B05B-7BBD3951EC36 Bestes Hotelangebot wählen und buchen &amp;#10; --->
        if (15 == id && msg.sender == participants[30]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(32768);
          _tokenState |= 1048576;
          continue;
        }
      }
      if (_tokenState & 65536 == 65536) {
        // <--- sid-09EEF503-5BBF-4379-8963-C7E17D275034 Bestes Flugangebot wählen und buchen &amp;#10; --->
        if (16 == id && msg.sender == participants[32]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(65536);
          _tokenState |= 2097152;
          continue;
        }
      }
      if (_tokenState & 3145728 == 3145728) {
        // <--- sid-372C160C-1432-41B2-A8E9-7081580A9C78 Rechnungen entgegen nehmen --->
        if (17 == id && msg.sender == participants[34]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(3145728);
          _tokenState |= 0;
          break; // is end
        }
      }
      break;
    }

    tokenState = _tokenState;
  }

}
