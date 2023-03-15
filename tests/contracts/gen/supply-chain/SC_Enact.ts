const enact = (tokenState: number, id: number, cond: number, participantID: number): number => {
  do {
    if (participantID === 0 && 0 == id && ((tokenState & 1) === 1)) {
      tokenState &= ~1;
      tokenState |= 2;
      break;
    }
    if (participantID === 4 && 1 == id && ((tokenState & 2) === 2)) {
      tokenState &= ~2;
      tokenState |= 12;
      break;
    }
    if (participantID === 1 && 2 == id && ((tokenState & 4) === 4)) {
      tokenState &= ~4;
      tokenState |= 16;
      break;
    }
    if (participantID === 1 && 3 == id && ((tokenState & 8) === 8)) {
      tokenState &= ~8;
      tokenState |= 32;
      break;
    }
    if (participantID === 3 && 4 == id && ((tokenState & 64) === 64)) {
      tokenState &= ~64;
      tokenState |= 128;
      break;
    }
    if (participantID === 2 && 5 == id && ((tokenState & 128) === 128)) {
      tokenState &= ~128;
      tokenState |= 256;
      break;
    }
    if (participantID === 2 && 6 == id && ((tokenState & 256) === 256)) {
      tokenState &= ~256;
      tokenState |= 512;
      break;
    }
    if (participantID === 3 && 7 == id && ((tokenState & 512) === 512)) {
      tokenState &= ~512;
      tokenState |= 1024;
      break;
    }
    if (participantID === 4 && 8 == id && ((tokenState & 1024) === 1024)) {
      tokenState &= ~1024;
      tokenState |= 2048;
      break;
    }
    if (participantID === 4 && 9 == id && ((tokenState & 2048) === 2048)) {
      tokenState &= ~2048;
      tokenState |= 0;
      break;
    }
  } while (false);

  while(tokenState !== 0) {
    if (((tokenState & 48) === 48)) {
      tokenState &= ~48;
      tokenState |= 64;
      continue;
    }
    break;
  }
  
  return tokenState;
}

export default enact;