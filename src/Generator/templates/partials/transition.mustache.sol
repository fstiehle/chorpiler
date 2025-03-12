// <--- {{#modelID}}{{modelID}} {{taskName}}{{/modelID}}{{^modelID}} auto transition {{/modelID}} --->
{{#hasConditions}}
if ( 
{{#conditions}}
{{> condition}}
{{/conditions}}
) {
{{/hasConditions}}
{{#taskName}}
// <--- custom code for task here --->
{{/taskName}}
_tokenState &= ~uint({{{consume}}});
_tokenState |= {{{produce}}};
{{#initiator}}
id = 0;
{{/initiator}}
{{#isEnd}}
break; // is end
{{/isEnd}}
{{^isEnd}}
continue; 
{{/isEnd}}
{{#hasConditions}}
}
{{/hasConditions}}
