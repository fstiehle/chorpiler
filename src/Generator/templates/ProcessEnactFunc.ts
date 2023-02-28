const enact = (tokenState: number, id: number, participantID: number): number => {
  do {
    {{#manualTransitions}}
    if ({{#initiator}}participantID === {{{initiator}}} && {{/initiator}}{{{id}}} == id && ((tokenState & {{{consume}}}) === {{{consume}}})) {
      tokenState &= ~{{{consume}}};
      tokenState |= {{{produce}}};
      break;
    }
    {{/manualTransitions}}
  } while (false);

  while(tokenState != 0) {
    {{#autonomousTransitions}}
    if ((tokenState & {{{consume}}}) === {{{consume}}}) {
      tokenState &= ~{{{consume}}};
      tokenState |= {{{produce}}};
      {{#isEnd}}
      break; // is end
      {{/isEnd}}
      {{^isEnd}}
      continue;
      {{/isEnd}}
    }
    {{/autonomousTransitions}}
    break;
  }
  
  return tokenState;
}

export default enact;