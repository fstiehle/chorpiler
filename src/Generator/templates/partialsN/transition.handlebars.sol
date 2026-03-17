// <--- {{#modelID}}{{modelID}} {{taskName}}{{/modelID}}{{^modelID}} auto transition {{/modelID}} --->
{{#if hasConditions}}
{{!// ---- additional conditions to be checked ----- }}
if ({{{conditionString}}}) {
  {{ > firing }}
}
{{/else}}
{{!// ---- no additional conditions to be checked: direct firing ----- }}
{{ > firing }}
{{/if}}