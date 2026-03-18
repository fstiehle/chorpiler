{{#if taskName}}
// <--- custom code for task here --->
{{/if}}
_tokenState &= ~uint({{{consume}}});
{{#if outTo}}
{{#if isSub}}
tokenState[{{outTo.call.id}}] = 1;
{{/if}}
{{#if isCall}}
{{{callString}}}
{{#if options.events}}
emit NewInstance({{{outTo.call.id}}}, instanceList[{{{outTo.call.id}}}]);
{{/if}}
{{/if}}
{{/if}}
{{#if produce}}
_tokenState |= {{{produce}}};
{{/if}}
{{#if options.events}}
{{#if taskID}}
emit Task({{taskID}});
{{/if}}
{{/if}}
{{#if isEnd}}
break; // is end
{{else}}
{{#if initiator}}
id = 0;
{{/if}}
continue;
{{/if}}