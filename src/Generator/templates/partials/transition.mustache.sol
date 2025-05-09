// <--- {{#modelID}}{{modelID}} {{taskName}}{{/modelID}}{{^modelID}} auto transition {{/modelID}} --->
{{#hasConditions}}
if ({{#conditions}}{{> condition}}{{/conditions}}) {
{{/hasConditions}}
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
{{#isEnd}}
break; // is end
{{/isEnd}}
{{^isEnd}}
{{#initiator}}
id = 0;
{{/initiator}}
continue; 
{{/isEnd}}
{{#hasConditions}}
}
{{/hasConditions}}