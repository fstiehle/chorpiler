const enact = (tokenState: number[], taskID: number, participantID: number): number[] => {  
  {{#manualTransitions}}
  if ({{#initiator}}participantID === {{{initiator}}} && {{/initiator}}{{{id}}} === taskID && tokenState[{{{consume}}}] === 1) {
      tokenState[{{{consume}}}] = 0;
      tokenState[{{{produce}}}] = 1;
  }
  {{/manualTransitions}}
  {{#autonomousTransitions}}
  if (tokenState[{{{consume}}}] === 1) {
      tokenState[{{{consume}}}] = 0;
      tokenState[{{{produce}}}] = 1;
  }
  {{/autonomousTransitions}}
  return tokenState;
}

export default enact;