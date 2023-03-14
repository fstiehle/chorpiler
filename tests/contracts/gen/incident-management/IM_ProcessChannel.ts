const enact = (tokenState: number, id: number, cond: number, participantID: number): number => {
  do {
    if (participantID === 0 && 0 == id && ((tokenState & 1) === 1)) {
      tokenState &= ~1;
      tokenState |= 2;
      break;
    }
    if (participantID === 1 && 1 == id && ((tokenState & 2) === 2)) {
      tokenState &= ~2;
      tokenState |= 4;
      break;
    }
    if (participantID === 1 && 2 == id && ((tokenState & 8) === 8)) {
      tokenState &= ~8;
      tokenState |= 0;
      break;
    }
    if (participantID === 1 && 3 == id && ((tokenState & 4) === 4)) {
      tokenState &= ~4;
      tokenState |= 16;
      break;
    }
    if (participantID === 2 && 4 == id && ((tokenState & 32) === 32)) {
      tokenState &= ~32;
      tokenState |= 8;
      break;
    }
    if (participantID === 2 && 5 == id && ((tokenState & 16) === 16)) {
      tokenState &= ~16;
      tokenState |= 64;
      break;
    }
    if (participantID === 3 && 6 == id && ((tokenState & 64) === 64)) {
      tokenState &= ~64;
      tokenState |= 128;
      break;
    }
    if (participantID === 4 && 7 == id && ((tokenState & 128) === 128)) {
      tokenState &= ~128;
      tokenState |= 256;
      break;
    }
    if (participantID === 3 && 8 == id && ((tokenState & 256) === 256)) {
      tokenState &= ~256;
      tokenState |= 32;
      break;
    }
  } while (false);

  while(tokenState !== 0) {
    if (((cond & 1) == 1) && ((tokenState & 16) === 16)) {
      tokenState &= ~16;
      tokenState |= 32;
      continue;
    }
    if (((cond & 2) == 2) && ((tokenState & 64) === 64)) {
      tokenState &= ~64;
      tokenState |= 256;
      continue;
    }
    if (((cond & 4) == 4) && ((tokenState & 4) === 4)) {
      tokenState &= ~4;
      tokenState |= 8;
      continue;
    }
    break;
  }
  
  return tokenState;
}

export default enact;