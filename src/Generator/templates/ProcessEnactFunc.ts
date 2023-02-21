const enact = (tokenState: number, id: number, participantID: number): number => {
  {{#manualTransitions}}
    if ({{#initiator}}participantID === {{{initiator}}} && {{/initiator}}{{{id}}} == id && ((tokenState & {{{consume}}}) === {{{consume}}})) {
      tokenState &= ~{{{consume}}};
      tokenState |= {{{produce}}};
    }
    {{/manualTransitions}}
    {{#autonomousTransitions}}
    if ((tokenState & {{{consume}}}) === {{{consume}}}) {
      tokenState &= ~{{{consume}}};
      tokenState |= {{{produce}}};
    }
    {{/autonomousTransitions}}
    return tokenState;
}

export default enact;