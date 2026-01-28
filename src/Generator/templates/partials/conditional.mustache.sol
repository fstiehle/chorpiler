// <--- {{#modelID}}{{modelID}} {{taskName}}{{/modelID}}{{^modelID}} auto transition {{/modelID}} --->
{{#hasConditions}}
if ({{{conditionString}}}) {
  {{ > transition }}
}
{{/hasConditions}}
{{^hasConditions}}
{{ > transition }}
{{/hasConditions}}
