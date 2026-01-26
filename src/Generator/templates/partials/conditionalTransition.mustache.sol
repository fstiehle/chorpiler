// <--- {{#modelID}}{{modelID}} {{taskName}}{{/modelID}}{{^modelID}} auto transition {{/modelID}} --->
{{#hasConditions}}
if ({{#conditions}}{{> condition}}{{/conditions}}) {
    {{ > transition }}
}
{{/hasConditions}}
{{^hasConditions}}
{{ > transition }}
{{/hasConditions}}
