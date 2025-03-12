{{#hasID}}
{{content}} == id
{{/hasID}}
{{#hasCondition}}
{{{content}}}
{{/hasCondition}}
{{#hasInitiator}}
msg.sender == participants[{{{content}}}]
{{/hasInitiator}}
{{^last}}
&& 
{{/last}}