{{#taskName}}
// <--- custom code for task here --->
{{/taskName}}
_tokenState &= ~uint({{{consume}}});
{{#outTo}}
tokenState[{{outTo.id}}] = {{outTo.produce}};
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
