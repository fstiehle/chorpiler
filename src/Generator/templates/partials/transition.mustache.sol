{{#taskName}}
// <--- custom code for task here --->
{{/taskName}}
_tokenState &= ~uint({{{consume}}});
{{#outTo}}
{{#isSub}}
tokenState[{{outTo.id}}] = 1;
{{/isSub}}
{{#isCall}}
ICalledProcessExecution(callList[{{outTo.id}}]).initiate();
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
