{{#if taskName}}
{{! // ---- Manual task ---- }}
// <--- custom code for task here --->
{{/if}}
{{! // ---- Consume token from place(s) ---- }}
_tokenState &= ~uint({{{consume}}});
{{#if outTo}}
{{#if isSub}}
{{! // ---- Sub Choreo Support: instanciate sub choreo ---- }}
{{> tokenstate id = outTo.id }} = 1;
{{/if}}
{{#if isCall}}
{{! // ---- Call Choreo Support: call external contract ---- }}
instanceList[{{{outTo.id}}}] = {{{outTo.name}}}.instance([{{{outTo.participants}}}]);
{{! // ---- Event Support ---- }}
{{#if options.events}}
emit NewInstance({{{outTo.id}}}, instanceList[{{{outTo.id}}}]);
{{/if}}
{{/if}}
{{/if}}
{{! // ---- produce tokens to outgoing place(s) ---- }}
{{#if hasProduce}}
_tokenState |= {{{produce}}};
{{/if}}
{{! // ---- Event Support ---- }}
{{#if options.events}}
{{#if taskID}}
emit Task({{taskID}});
{{/if}}
{{/if}}
{{! // ---- if task leads to end: break out of main loop ---- }}
{{#if isEnd}}
break; // is end
{{else}}
{{! // ---- Loop Support ---- }}
{{! // ---- if task is initiated (i.e., has an ID), set the ID to 0 (NoOp) after ---- }}
{{! // ---- before continuing with the loop, so the task is not auto triggered again ---- }}
{{#if initiator}}
id = 0;
{{/if}}
continue;
{{/if}}