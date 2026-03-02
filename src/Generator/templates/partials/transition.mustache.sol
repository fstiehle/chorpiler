{{#taskName}}
// <--- custom code for task here --->
{{/taskName}}
_tokenState &= ~uint({{{consume}}});
{{#outTo}}
{{#isSub}}
tokenState[{{outTo.call.id}}] = 1;
{{/isSub}}
{{#isCall}}
{{{callString}}}
{{#options.events}}
emit NewInstance({{{outTo.call.id}}}, instanceList[{{{outTo.call.id}}}]);
{{/options.events}}
{{/isCall}}
{{/outTo}}
{{#produce}}
_tokenState |= {{{produce}}};
{{/produce}}
{{#options.events}}{{#taskID}}
emit Task({{taskID}});
{{/taskID}}{{/options.events}}
{{#isEnd}}
break; // is end
{{/isEnd}}
{{^isEnd}}
{{#initiator}}
{{#options.loopProtection}}
id = 0;
{{/options.loopProtection}}
{{/initiator}}
continue;
{{/isEnd}}
