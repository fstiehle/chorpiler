//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract test_sid_1ddbffe1_36ab_4084_8aab_a49f9e2b1ac6 {
  uint public tokenState = 1;
  address[32] public participants;
  uint public conditions;

  constructor(address[32] memory _participants) {
    participants = _participants;
  }
  function setConditions(uint _conditions) external {
    conditions = _conditions;
  }

  function enact(uint id) external {
    uint _tokenState = tokenState;

    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- sid-4D6F0ED5-C6E1-4088-A672-54F2434B9F50 Generar Ficha --->
        if (1 == id && msg.sender == participants[0]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- sid-F056A6B5-98B7-4556-BB70-95D6796EEB5D Fijar Precio de Venta en GPO --->
        if (2 == id && msg.sender == participants[2]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- sid-E5D2A2C2-5F09-4907-866D-BBA9E6A72AE7 Aprobar Presupuesto en GPO --->
        if (3 == id && msg.sender == participants[4]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 504;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- sid-EF47541B-C496-402B-9913-F0EF0054F5E5 Generar Ficha --->
        if (4 == id && msg.sender == participants[6]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8);
        _tokenState |= 512;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- sid-2AA51985-12A2-4073-9F77-3A6E481D3651 Flujo de Materiales --->
        if (5 == id && msg.sender == participants[8]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(16);
        _tokenState |= 1024;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- sid-DEE6F3F9-F974-4BBE-BF56-6875CD3F8163 Flujo de Subcontrato --->
        if (6 == id && msg.sender == participants[10]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(32);
        _tokenState |= 2048;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 64 == 64) {
        // <--- sid-2E053530-C550-420E-9DB4-05C0F01102C5 Flujo de Arriendos --->
        if (7 == id && msg.sender == participants[12]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(64);
        _tokenState |= 4096;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 128 == 128) {
        // <--- sid-062E41D5-B07F-4697-B6A3-29AD222F4671 Flujo de Mano de Obra --->
        if (8 == id && msg.sender == participants[14]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(128);
        _tokenState |= 8192;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 256 == 256) {
        // <--- sid-22DCD482-9B3B-4924-A05C-8F6DA22D5611 Flujo de Gastos Administrativos --->
        if (9 == id && msg.sender == participants[16]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(256);
        _tokenState |= 16384;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 32768 == 32768) {
        // <--- sid-DA88A386-D76C-41BD-9278-BBCF69B5DF9E Flujo de EEPP Venta --->
        if (10 == id && msg.sender == participants[18]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(32768);
        _tokenState |= 65536;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 131072 == 131072) {
        // <--- sid-AA46FC92-E951-44AC-B44F-7D2D5D1328D3 Flujo Avance Físico --->
        if (11 == id && msg.sender == participants[20]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(131072);
        _tokenState |= 262144;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 524288 == 524288) {
        // <--- sid-910406FA-4C2F-4E38-A9DB-858DA91512AE Flujo de Proyecciones --->
        if (12 == id && msg.sender == participants[22]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(524288);
        _tokenState |= 1048576;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 1376256 == 1376256) {
        // <--- sid-0F6FB4A1-9F39-4AFA-A392-78C7FDAA5031 Libro Gerencial --->
        if (13 == id && msg.sender == participants[24]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1376256);
        _tokenState |= 512;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 2097152 == 2097152) {
        // <--- sid-7E6B1C6D-199E-4526-BCCC-7D2D040508DF Flujo Cambios de Ingeniería --->
        if (14 == id && msg.sender == participants[26]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2097152);
        _tokenState |= 4194304;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 8388608 == 8388608) {
        // <--- sid-0E5E89B2-EB5A-462B-A279-0C0085D263BD Flujo de Adendas --->
        if (15 == id && msg.sender == participants[28]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8388608);
        _tokenState |= 16777216;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 512 == 512) {
        // <--- sid-85F6C96F-316E-4327-B493-CD36B03C5F8B Flujo Cierre de Obra --->
        if (16 == id && msg.sender == participants[30]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(512);
        _tokenState |= 0;
        break; // is end
        }
      }
      if (_tokenState & 31744 == 31744) {
        // <---  auto transition  --->
        _tokenState &= ~uint(31744);
        _tokenState |= 512;
        continue; 
      }
      if (_tokenState & 20971520 == 20971520) {
        // <---  auto transition  --->
        _tokenState &= ~uint(20971520);
        _tokenState |= 512;
        continue; 
      }
      if (_tokenState & 496 == 496) {
        if (conditions & 1 == 1) {
          // <---  auto transition  --->
          _tokenState &= ~uint(496);
          _tokenState |= 688128;
          continue; 
        }
        if (conditions & 2 == 2) {
          // <---  auto transition  --->
          _tokenState &= ~uint(496);
          _tokenState |= 10485760;
          continue; 
        }
      }
      break;
    }

    tokenState = _tokenState;
  }

}